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
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';
import { useAuth } from '../context/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const settingsOptions = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      subtitle: 'How we protect your data',
      icon: '🔒',
      onPress: () => handleOpenLink('https://budzee.com/privacy'),
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      subtitle: 'Rules and regulations',
      icon: '📋',
      onPress: () => handleOpenLink('https://budzee.com/terms'),
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
      onPress: () => handleContactSupport(),
    },
    {
      id: 'rate',
      title: 'Rate Our App',
      subtitle: 'Share your feedback',
      icon: '⭐',
      onPress: () => handleRateApp(),
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
          onPress: () => Linking.openURL('mailto:support@budzee.com'),
        },
        {
          text: 'WhatsApp',
          onPress: () => Linking.openURL('https://wa.me/919999999999'),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleRateApp = () => {
    // Replace with actual app store URLs
    const androidUrl = 'market://details?id=com.budzee.app';
    const iosUrl = 'https://apps.apple.com/app/budzee/id123456789';
    
    Alert.alert(
      'Rate Budzee',
      'Help us improve by rating our app!',
      [
        {
          text: 'Rate on Play Store',
          onPress: () => Linking.openURL(androidUrl),
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
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
            <Text style={styles.versionText}>Budzee Gaming v1.0.0</Text>
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
              Made with ❤️ for gaming enthusiasts
            </Text>
            <Text style={styles.footerSubtext}>
              © 2024 Budzee Gaming. All rights reserved.
            </Text>
          </View>
        </ScrollView>
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
});

export default SettingsScreen;