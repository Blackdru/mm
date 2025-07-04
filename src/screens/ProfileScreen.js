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
  SafeAreaView,
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
      <SafeAreaView style={commonStyles.safeContainer}>
        {!isNewUser && (
          <CommonHeader
            title="Profile"
            subtitle="Manage your gaming account"
            icon="👤"
            onBackPress={handleBackPress}
          />
        )}
        
        <KeyboardAvoidingView 
          style={styles.container} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Welcome Section for New Users */}
            {isNewUser && (
              <View style={styles.welcomeSection}>
                <View style={styles.welcomeIconContainer}>
                  <Text style={styles.welcomeIcon}>🎉</Text>
                </View>
                <Text style={styles.welcomeTitle}>Welcome to Budzee!</Text>
                <Text style={styles.welcomeText}>
                  You're just one step away from joining the ultimate gaming arena. 
                  Complete your profile to start playing and winning real money!
                </Text>
              </View>
            )}
            
            {/* Centered Profile Card */}
            <View style={styles.profileCardContainer}>
              <View style={[commonStyles.centerCard, styles.profileCard]}>
                <View style={styles.profileHeader}>
                  <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {name ? name.charAt(0).toUpperCase() : '👤'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.profileTitle}>
                    {isNewUser ? '🚀 Setup Your Profile' : '✏️ Edit Profile'}
                  </Text>
                </View>

                {/* Mobile Number Display */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>📱 Mobile Number</Text>
                  <View style={styles.phoneContainer}>
                    <Text style={styles.phoneNumber}>{user?.phoneNumber}</Text>
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>✅ Verified</Text>
                    </View>
                  </View>
                </View>
                
                {/* Name Input */}
                <View style={styles.fieldContainer}>
                  <Text style={[styles.fieldLabel, styles.required]}>👤 Full Name *</Text>
                  <TextInput
                    style={[
                      commonStyles.input,
                      styles.textInput,
                      !name.trim() && styles.inputError
                    ]}
                    value={name}
                    onChangeText={setName}
                    placeholder="Enter your full name"
                    placeholderTextColor={theme.colors.textTertiary}
                    autoCapitalize="words"
                    returnKeyType="next"
                    editable={!loading}
                  />
                  {!name.trim() && (
                    <Text style={styles.errorText}>Name is required to continue</Text>
                  )}
                </View>
                
                {/* Email Input */}
                <View style={styles.fieldContainer}>
                  <Text style={styles.fieldLabel}>📧 Email Address (Optional)</Text>
                  <TextInput
                    style={[commonStyles.input, styles.textInput]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="Enter your email address"
                    placeholderTextColor={theme.colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    returnKeyType="done"
                    editable={!loading}
                  />
                  <Text style={styles.fieldHint}>
                    We'll use this for important updates and notifications
                  </Text>
                </View>
                
                {/* Save Button */}
                <TouchableOpacity 
                  style={[
                    commonStyles.largeButton, 
                    styles.saveButton,
                    loading && styles.saveButtonDisabled
                  ]} 
                  onPress={handleSave} 
                  disabled={loading}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                      <Text style={[commonStyles.largeButtonText, styles.loadingText]}>
                        {isNewUser ? 'Setting up...' : 'Saving...'}
                      </Text>
                    </View>
                  ) : (
                    <Text style={[commonStyles.largeButtonText, styles.saveButtonText]}>
                      {isNewUser ? '🚀 Complete Setup & Start Playing' : '💾 Save Changes'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Gaming Features for New Users */}
            {isNewUser && (
              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>🎮 What's Waiting for You</Text>
                
                <View style={styles.featuresGrid}>
                  <View style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>🧠</Text>
                    </View>
                    <Text style={styles.featureTitle}>Memory Games</Text>
                    <Text style={styles.featureText}>
                      Challenge your memory skills in exciting card matching tournaments
                    </Text>
                  </View>
                  
                  <View style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>💰</Text>
                    </View>
                    <Text style={styles.featureTitle}>Real Money Wins</Text>
                    <Text style={styles.featureText}>
                      Win actual cash prizes that you can withdraw instantly
                    </Text>
                  </View>
                  
                  <View style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>⚡</Text>
                    </View>
                    <Text style={styles.featureTitle}>Instant Payouts</Text>
                    <Text style={styles.featureText}>
                      Quick and secure money transfers directly to your bank
                    </Text>
                  </View>
                  
                  <View style={styles.featureCard}>
                    <View style={styles.featureIconContainer}>
                      <Text style={styles.featureIcon}>🏆</Text>
                    </View>
                    <Text style={styles.featureTitle}>Leaderboards</Text>
                    <Text style={styles.featureText}>
                      Compete with players across India and climb the rankings
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  
  welcomeSection: {
    alignItems: 'center',
    marginVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    ...theme.shadows.primaryShadow,
  },
  welcomeIcon: {
    fontSize: 36,
  },
  welcomeTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  
  profileCardContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  profileCard: {
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.primaryShadow,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  avatarContainer: {
    marginBottom: theme.spacing.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.primary,
    ...theme.shadows.successShadow,
  },
  avatarText: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  profileTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  
  fieldContainer: {
    marginBottom: theme.spacing.xl,
    width: '100%',
  },
  fieldLabel: { 
    fontSize: theme.fonts.sizes.lg, 
    color: theme.colors.textPrimary, 
    marginBottom: theme.spacing.md, 
    fontWeight: '600',
  },
  required: { 
    color: theme.colors.textDanger,
  },
  phoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  phoneNumber: { 
    fontSize: theme.fonts.sizes.lg, 
    color: theme.colors.textPrimary, 
    fontWeight: '600',
  },
  verifiedBadge: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  verifiedText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  textInput: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '500',
  },
  inputError: {
    borderColor: theme.colors.danger,
    borderWidth: 2,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDanger,
    marginTop: theme.spacing.sm,
    fontWeight: '600',
  },
  fieldHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textTertiary,
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  
  saveButton: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.fonts.sizes.lg,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
  },
  
  featuresSection: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
  },
  featuresTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  featureCard: {
    width: '47%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  featureIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  featureIcon: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  featureText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default ProfileScreen;