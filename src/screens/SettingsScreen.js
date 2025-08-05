import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Linking,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';

const SettingsScreen = ({ navigation }) => {
  const { user, logout, token } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackType, setFeedbackType] = useState('GENERAL');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const settingsOptions = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      icon: '🔒',
      onPress: () => handleOpenLink('https://budzee.in/privacy'),
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'Rules and regulations',
      icon: '📋',
      onPress: () => handleOpenLink('https://budzee.in/terms'),
    },
    {
      id: 'faq',
      title: 'FAQ',
      subtitle: 'Frequently asked questions',
      icon: '❓',
      onPress: () => navigation.navigate('FAQ'),
    },
    {
      id: 'about',
      title: 'About Budzee',
      subtitle: 'Learn more about our app',
      icon: 'ℹ️',
      onPress: () => navigation.navigate('About'),
    },
    {
      id: 'support',
      title: 'Customer Support',
      subtitle: 'Get help and support',
      icon: '🎧',
      onPress: () => handleOpenLink('https://budzee.in/contact'),
    },
    {
      id: 'feedback',
      title: 'Send Feedback',
      subtitle: 'Report issues or suggestions',
      icon: '💬',
      onPress: () => handleFeedback(),
    },
  ];

  const handleOpenLink = async (url) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open link');
      }
    } catch (error) {
      Alert.alert('Error', 'Unable to open link');
    }
  };

  const handleContactSupport = () => {
    Alert.alert(
      'Customer Support',
      'Choose how you want to contact us:',
      [
        {
          text: 'Email',
          onPress: () => Linking.openURL('mailto:support@budzee.in'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/919999999999'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleFeedback = () => {
    setShowFeedbackModal(true);
  };

  const closeFeedbackModal = () => {
    setShowFeedbackModal(false);
    setFeedbackText('');
    setFeedbackType('GENERAL');
  };

  
  const submitFeedback = async () => {
    if (!feedbackText || feedbackText.trim().length === 0) {
      Alert.alert('Error', 'Please enter your feedback');
      return;
    }

    if (feedbackText.trim().length > 1000) {
      Alert.alert('Error', 'Feedback message is too long (max 1000 characters)');
      return;
    }

    setSubmittingFeedback(true);

    try {
      if (!token) {
        console.log('❌ Missing token for feedback');
        Alert.alert('Error', 'Please login again to submit feedback');
        setSubmittingFeedback(false);
        return;
      }

      // Test basic connectivity first
      console.log('🔍 Testing basic connectivity...');
      try {
        const healthCheck = await fetch(`${config.SERVER_URL}/health`, {
          method: 'GET',
          timeout: 5000,
        });
        console.log('✅ Health check response:', healthCheck.status);
      } catch (healthError) {
        console.error('❌ Health check failed:', healthError);
        throw new Error(`Cannot connect to server: ${healthError.message}`);
      }

      const apiUrl = `${config.API_BASE_URL}/feedback/submit`;
      const payload = {
        message: feedbackText.trim(),
        type: feedbackType,
      };

      console.log('📤 Sending feedback to:', apiUrl);
      console.log('📦 Payload:', payload);
      console.log('🔑 Token exists:', !!token);
      console.log('🔑 Token preview:', token ? `${token.substring(0, 20)}...` : 'No token');

      const requestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      };

      console.log('📋 Request options:', {
        method: requestOptions.method,
        headers: requestOptions.headers,
        bodyLength: requestOptions.body.length
      });

      const response = await fetch(apiUrl, requestOptions);

      console.log('📥 Response status:', response.status);
      console.log('📥 Response ok:', response.ok);
      console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

      let data;
      try {
        data = await response.json();
        console.log('📥 Response data:', data);
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        const textResponse = await response.text();
        console.log('📥 Raw response text:', textResponse);
        throw new Error('Invalid response format from server');
      }

      if (response.ok && data.success) {
        closeFeedbackModal();
        Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
      } else {
        const errorMessage = data.message || `Server error: ${response.status}`;
        console.error('❌ Feedback submission failed:', errorMessage);
        Alert.alert('Error', errorMessage);
      }
    } catch (error) {
      console.error('❌ Submit feedback error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Network error. Please try again later.';
      
      if (error.message.includes('Network request failed')) {
        errorMessage = 'Network connection failed. Please check your internet connection.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      } else if (error.message.includes('Invalid response format')) {
        errorMessage = 'Server response error. Please try again later.';
      } else if (error.name === 'TypeError') {
        errorMessage = 'Connection error. Please check your network settings.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmittingFeedback(false);
    }
  };


  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.navigate('Auth');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Account Deletion',
              'Please contact support to delete your account.',
              [
                {
                  text: 'Contact Support',
                  onPress: handleContactSupport,
                },
                { text: 'Cancel', style: 'cancel' },
              ]
            );
          },
        },
      ]
    );
  };

  const renderSettingItem = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.onPress}
    >
      <View style={styles.settingIcon}>
        <Text style={styles.settingIconText}>{item.icon}</Text>
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
      </View>
      <Text style={styles.settingArrow}>›</Text>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title="Settings"
          subtitle="Manage your preferences"
          icon="⚙️"
          onBackPress={() => navigation.goBack()}
        />

        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* User Info Section */}
          <View style={[commonStyles.attractiveCard, styles.userCard]}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '🎮'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>{user?.name || 'Gaming Champion'}</Text>
                <Text style={styles.userPhone}>{user?.phoneNumber || 'Not provided'}</Text>
                <Text style={styles.userStatus}>🟢 Active Player</Text>
              </View>
            </View>
          </View>

          {/* App Version */}
          <View style={styles.versionCard}>
            <Text style={styles.versionText}>Budzee Gaming v1.0.3</Text>
            <Text style={styles.versionSubtext}>Latest version installed</Text>
          </View>

          {/* Settings Options */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>📱 App Information</Text>
            <View style={styles.settingsList}>
              {settingsOptions.map(renderSettingItem)}
            </View>
          </View>

          {/* Account Actions */}
          <View style={styles.actionsSection}>
            <Text style={styles.sectionTitle}>👤 Account Actions</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={handleLogout}>
              <Text style={styles.actionIcon}>🚪</Text>
              <Text style={styles.actionText}>Logout</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.dangerAction]} 
              onPress={handleDeleteAccount}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, styles.dangerText]}>Delete Account</Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Budrock Technologies Private Limited
            </Text>
            <Text style={styles.footerSubtext}>
              © 2025 Budzee. All rights reserved.
            </Text>
          </View>
        </ScrollView>

        {/* Feedback Modal */}
        <Modal
          visible={showFeedbackModal}
          transparent={true}
          animationType="slide"
          onRequestClose={closeFeedbackModal}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>💬 Send Feedback</Text>
              <Text style={styles.modalSubtitle}>
                Help us improve by sharing your thoughts, suggestions, or reporting issues.
              </Text>

              {/* Feedback Type Selector */}
              <Text style={styles.sectionLabel}>Feedback Type:</Text>
              <View style={styles.typeSelector}>
                <TouchableOpacity
                  style={[styles.typeButton, feedbackType === 'GENERAL' && styles.selectedType]}
                  onPress={() => setFeedbackType('GENERAL')}
                >
                  <Text style={[styles.typeText, feedbackType === 'GENERAL' && styles.selectedTypeText]}>
                    💬 General
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.typeButton, feedbackType === 'BUG_REPORT' && styles.selectedType]}
                  onPress={() => setFeedbackType('BUG_REPORT')}
                >
                  <Text style={[styles.typeText, feedbackType === 'BUG_REPORT' && styles.selectedTypeText]}>
                    🐛 Bug Report
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.typeButton, feedbackType === 'SUGGESTION' && styles.selectedType]}
                  onPress={() => setFeedbackType('SUGGESTION')}
                >
                  <Text style={[styles.typeText, feedbackType === 'SUGGESTION' && styles.selectedTypeText]}>
                    💡 Suggestion
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Feedback Text Input */}
              <Text style={styles.sectionLabel}>Your Message:</Text>
              <TextInput
                style={styles.feedbackInput}
                placeholder="Tell us what's on your mind..."
                placeholderTextColor={theme.colors.textTertiary}
                value={feedbackText}
                onChangeText={setFeedbackText}
                multiline={true}
                numberOfLines={6}
                maxLength={1000}
                editable={!submittingFeedback}
                textAlignVertical="top"
              />
              
              <Text style={styles.characterCount}>
                {feedbackText.length}/1000 characters
              </Text>

              {/* Modal Buttons */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={closeFeedbackModal}
                  disabled={submittingFeedback}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.submitButton]}
                  onPress={submitFeedback}
                  disabled={submittingFeedback || !feedbackText.trim()}
                >
                  {submittingFeedback ? (
                    <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.submitButtonText}>Send Feedback</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },

  userCard: {
    marginBottom: theme.spacing.lg,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.secondary,
    ...theme.shadows.primaryShadow,
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  userStatus: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSuccess,
    fontWeight: '500',
  },

  versionCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  versionText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },

  settingsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  settingsList: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
  },
  settingIconText: {
    fontSize: 18,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  settingArrow: {
    fontSize: 20,
    color: theme.colors.textSecondary,
    fontWeight: 'bold',
  },

  actionsSection: {
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dangerAction: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  actionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  actionText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  dangerText: {
    color: theme.colors.danger,
  },

  footer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  footerText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  footerSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
  },

  // Feedback Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  typeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  typeButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedType: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  typeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedTypeText: {
    color: theme.colors.textPrimary,
  },
  feedbackInput: {
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'right',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  submitButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  submitButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
});

export default SettingsScreen;