import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import { testReferralCode } from '../utils/diagnostics';

const ReferralCodeScreen = ({ navigation, route }) => {
  const [referralCode, setReferralCode] = useState('');
  const { phoneNumber, otp, onComplete } = route.params;

  const handleSubmit = () => {
    // Enhanced validation with better error messages
    if (referralCode && referralCode.trim() !== '') {
      const isValid = testReferralCode(referralCode);
      if (!isValid) {
        Alert.alert(
          'Invalid Referral Code', 
          'Please enter a valid referral code.\n\nFormat: BZ followed by 4-10 characters\nExamples: BZ1234, BZTEST01, BZABC123',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    
    // Pass the referral code (empty string if blank, null if skipped)
    const codeToPass = referralCode.trim() === '' ? null : referralCode.trim();
    onComplete(codeToPass);
  };

  const handleSkip = () => {
    onComplete(null);
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>🎁 Referral Code</Text>
            <Text style={styles.subtitle}>
              Enter a referral code to get ₹25 bonus!
            </Text>
            <Text style={styles.description}>
              Both you and your friend will receive ₹25 game credits
            </Text>
          </View>

          <View style={[commonStyles.attractiveCard, styles.formCard]}>
            <Text style={styles.inputLabel}>Referral Code (Optional)</Text>
            <TextInput
              style={[commonStyles.input, styles.codeInput]}
              placeholder="BZ123456"
              placeholderTextColor={theme.colors.textTertiary}
              value={referralCode}
              onChangeText={(text) => setReferralCode(text.toUpperCase())}
              maxLength={10}
              autoCapitalize="characters"
            />
            <Text style={styles.inputHint}>
              Ask your friend for their referral code
            </Text>

            <TouchableOpacity
              style={[commonStyles.largeButton, styles.submitButton]}
              onPress={handleSubmit}>
              <Text style={commonStyles.largeButtonText}>
                {referralCode ? '🎁 Apply Code & Continue' : '➡️ Continue'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}>
              <Text style={styles.skipText}>Skip for now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.benefitsCard}>
            <Text style={styles.benefitsTitle}>🌟 Referral Benefits</Text>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>💰</Text>
              <Text style={styles.benefitText}>Get ₹25 instantly</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🎮</Text>
              <Text style={styles.benefitText}>Use for playing games</Text>
            </View>
            <View style={styles.benefitItem}>
              <Text style={styles.benefitIcon}>🤝</Text>
              <Text style={styles.benefitText}>Your friend gets ₹25 too</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xl,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.accent,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    marginBottom: theme.spacing.lg,
  },
  inputLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  codeInput: {
    textAlign: 'center',
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  inputHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  submitButton: {
    marginBottom: theme.spacing.md,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  skipText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  benefitsCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  benefitsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  benefitText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default ReferralCodeScreen;