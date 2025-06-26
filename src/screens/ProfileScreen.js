import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const ProfileScreen = ({ navigation }) => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);
  
  // Check if this is a new user (no name set)
  const isNewUser = !user?.name || user.name.trim() === '';

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    setLoading(true);
    const result = await updateProfile({ name: name.trim(), email: email.trim() });
    setLoading(false);
    
    if (result.success) {
      if (isNewUser) {
        Alert.alert('Welcome!', 'Profile setup complete!', [
          { text: 'Continue', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        Alert.alert('Success', 'Profile updated!');
        navigation.navigate('Home');
      }
    } else {
      Alert.alert('Error', result.message || 'Failed to update profile');
    }
  };

  const handleBackPress = () => {
    if (isNewUser) {
      // For new users, we might want to prevent going back or show a warning
      Alert.alert(
        'Complete Profile',
        'Please complete your profile to continue using the app.',
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate('Home');
    }
  };

  return (
    <GradientBackground>
      {!isNewUser && (
        <CommonHeader
          title="Edit Profile"
          icon="👤"
          onBackPress={handleBackPress}
        />
      )}
      
      <KeyboardAvoidingView 
        style={commonStyles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={commonStyles.scrollContainer} 
          showsVerticalScrollIndicator={false}
        >
          {/* Welcome Section for New Users */}
          {isNewUser && (
            <View style={styles.welcomeSection}>
              <View style={[commonStyles.card, styles.welcomeCard]}>
                <Text style={styles.welcomeEmoji}>🎉</Text>
                <Text style={styles.welcomeText}>Welcome to Budzee!</Text>
                <Text style={styles.welcomeSubtext}>
                  You're just one step away from joining the ultimate gaming arena!
                </Text>
              </View>
            </View>
          )}
          
          {/* Profile Form */}
          <View style={[commonStyles.card, styles.formCard]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {isNewUser ? '📝 Setup Your Profile' : '✏️ Edit Information'}
              </Text>
            </View>

            {/* Mobile Number Display */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>📱 Mobile Number</Text>
              <View style={styles.valueContainer}>
                <Text style={styles.value}>{user?.phoneNumber}</Text>
                <Text style={styles.verifiedBadge}>✅ Verified</Text>
              </View>
            </View>
            
            {/* Name Input */}
            <View style={styles.fieldContainer}>
              <Text style={[styles.label, styles.required]}>👤 Full Name *</Text>
              <TextInput
                style={[commonStyles.input, !name.trim() && styles.inputError]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={theme.colors.textLight}
                autoCapitalize="words"
                returnKeyType="next"
              />
              {!name.trim() && (
                <Text style={styles.errorText}>Name is required</Text>
              )}
            </View>
            
            {/* Email Input */}
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>📧 Email Address (Optional)</Text>
              <TextInput
                style={commonStyles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>
            
            {/* Save Button */}
            <TouchableOpacity 
              style={[commonStyles.button, styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textPrimary} size="small" />
              ) : (
                <Text style={commonStyles.buttonText}>
                  {isNewUser ? '🚀 Complete Setup & Continue' : '💾 Save Changes'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Gaming Features for New Users */}
          {isNewUser && (
            <View style={styles.section}>
              <Text style={commonStyles.sectionTitle}>🎮 What's Waiting for You</Text>
              <View style={styles.featuresGrid}>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🎲</Text>
                  <Text style={styles.featureText}>Ludo Tournaments</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>💰</Text>
                  <Text style={styles.featureText}>Real Money Wins</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureText}>Instant Payouts</Text>
                </View>
                <View style={styles.featureItem}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={styles.featureText}>Leaderboards</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  welcomeSection: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  welcomeCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 230, 109, 0.3)',
  },
  welcomeEmoji: {
    fontSize: 32,
    marginBottom: theme.spacing.xs,
  },
  welcomeText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 18,
  },
  formCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  fieldContainer: {
    marginBottom: theme.spacing.sm,
  },
  label: { 
    fontSize: theme.fonts.sizes.sm, 
    color: theme.colors.textDark, 
    marginBottom: theme.spacing.xs, 
    fontWeight: '600',
  },
  required: { 
    color: theme.colors.danger,
  },
  valueContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceDark,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
  value: { 
    fontSize: theme.fonts.sizes.sm, 
    color: theme.colors.textDark, 
    fontWeight: '500',
  },
  verifiedBadge: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  errorText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  saveBtn: {
    marginTop: theme.spacing.sm,
  },
  saveBtnDisabled: {
    backgroundColor: theme.colors.textLight,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  featureItem: {
    width: '48%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ProfileScreen;