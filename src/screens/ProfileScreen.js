import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';

const { width, height } = Dimensions.get('window');

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
        navigation.goBack();
      }
    } else {
      Alert.alert('Error', result.message || 'Failed to update profile');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.container} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContainer}
        >
          {/* Header */}
          <View style={styles.header}>
            {!isNewUser && (
              <TouchableOpacity 
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <Text style={styles.backText}>← Back</Text>
              </TouchableOpacity>
            )}
            <Text style={styles.title}>
              {isNewUser ? '🎮 Complete Your Profile' : '👤 Edit Profile'}
            </Text>
          </View>
          
          {/* Welcome Section for New Users */}
          {isNewUser && (
            <View style={styles.welcomeSection}>
              <View style={styles.welcomeCard}>
                <Text style={styles.welcomeEmoji}>🎉</Text>
                <Text style={styles.welcomeText}>Welcome to Budzee!</Text>
                <Text style={styles.welcomeSubtext}>
                  You're just one step away from joining the ultimate gaming arena!
                </Text>
              </View>
            </View>
          )}
          
          {/* Profile Form */}
          <View style={styles.formCard}>
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
                style={[styles.input, !name.trim() && styles.inputError]}
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
                style={styles.input}
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
              style={[styles.saveBtn, loading && styles.saveBtnDisabled]} 
              onPress={handleSave} 
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.textPrimary} size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {isNewUser ? '🚀 Complete Setup & Continue' : '💾 Save Changes'}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Gaming Features for New Users */}
          {isNewUser && (
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>🎮 What's Waiting for You</Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  backButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  backText: { 
    fontSize: theme.fonts.sizes.md, 
    color: theme.colors.secondary, 
    fontWeight: '600' 
  },
  title: { 
    fontSize: theme.fonts.sizes.xl, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    textAlign: 'center', 
    flex: 1,
  },
  welcomeSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  welcomeCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 230, 109, 0.3)',
  },
  welcomeEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  welcomeText: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  welcomeSubtext: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  formCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.large,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  formTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  fieldContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: { 
    fontSize: theme.fonts.sizes.md, 
    color: theme.colors.textDark, 
    marginBottom: theme.spacing.sm, 
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
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  value: { 
    fontSize: theme.fonts.sizes.md, 
    color: theme.colors.textDark, 
    fontWeight: '500',
  },
  verifiedBadge: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  input: {
    ...commonStyles.input,
    fontSize: theme.fonts.sizes.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    ...theme.shadows.small,
  },
  inputError: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  errorText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.lg,
    ...theme.shadows.medium,
  },
  saveBtnDisabled: {
    backgroundColor: theme.colors.textLight,
    ...theme.shadows.small,
  },
  saveBtnText: { 
    color: theme.colors.textPrimary, 
    fontSize: theme.fonts.sizes.md, 
    fontWeight: 'bold',
  },
  featuresSection: {
    paddingHorizontal: theme.spacing.lg,
  },
  featuresTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureItem: {
    width: '48%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  featureText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ProfileScreen;
