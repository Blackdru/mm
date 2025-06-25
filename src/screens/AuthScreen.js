import React, {useState} from 'react';
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
import {useAuth} from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const AuthScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [timer, setTimer] = useState(0);

  const {sendOTP, verifyOTP} = useAuth();

  const formatPhoneNumber = (text) => {
    // Remove all non-digits
    const cleaned = text.replace(/\D/g, '');
    
    // Add +91 prefix if not present
    if (cleaned.length > 0 && !cleaned.startsWith('91')) {
      return '+91' + cleaned.slice(-10);
    } else if (cleaned.startsWith('91')) {
      return '+' + cleaned;
    }
    
    return text;
  };

  const handleSendOTP = async () => {
    if (!phoneNumber || phoneNumber.length !== 13) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    const result = await sendOTP(phoneNumber);
    setLoading(false);

    if (result.success) {
      setStep('otp');
      setOtpSent(true);
      startTimer();
      Alert.alert('Success', 'OTP sent successfully!');
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, otp);
      setLoading(false);

      if (result.success) {
        // Don't show alert, let the app navigate automatically
        console.log('OTP verification successful, user will be redirected');
      } else {
        Alert.alert('Error', result.message || 'Invalid OTP. Please try again.');
      }
    } catch (error) {
      setLoading(false);
      console.error('OTP verification error:', error);
      Alert.alert('Error', 'Something went wrong. Please try again.');
    }
  };

  const startTimer = () => {
    setTimer(60);
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOTP = () => {
    if (timer === 0) {
      handleSendOTP();
    }
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={commonStyles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}>
          
          {/* App Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoEmoji}>🎮</Text>
              <Text style={styles.title}>BUDZEE</Text>
              <Text style={styles.tagline}>Gaming Arena</Text>
            </View>
            <Text style={styles.subtitle}>
              {step === 'phone'
                ? 'Enter your mobile number to join the game!'
                : 'Enter the OTP sent to your mobile'}
            </Text>
          </View>

          {/* Form Card */}
          <View style={[commonStyles.card, styles.formCard]}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>
                {step === 'phone' ? '📱 Phone Verification' : '🔐 OTP Verification'}
              </Text>
            </View>

            {step === 'phone' ? (
              <>
                <Text style={styles.label}>Mobile Number</Text>
                <TextInput
                  style={commonStyles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor={theme.colors.textLight}
                  value={phoneNumber}
                  onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                  keyboardType="phone-pad"
                  maxLength={13}
                  editable={!loading}
                />
                
                <TouchableOpacity
                  style={[commonStyles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendOTP}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                  ) : (
                    <Text style={commonStyles.buttonText}>🚀 Send OTP</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.label}>Enter OTP</Text>
                <Text style={styles.phoneDisplay}>📱 {phoneNumber}</Text>
                
                <TextInput
                  style={[commonStyles.input, styles.otpInput]}
                  placeholder="000000"
                  placeholderTextColor={theme.colors.textLight}
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                  textAlign="center"
                />
                
                <TouchableOpacity
                  style={[commonStyles.button, loading && styles.buttonDisabled]}
                  onPress={handleVerifyOTP}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                  ) : (
                    <Text style={commonStyles.buttonText}>✅ Verify & Continue</Text>
                  )}
                </TouchableOpacity>

                <View style={styles.resendContainer}>
                  {timer > 0 ? (
                    <Text style={styles.timerText}>
                      ⏱️ Resend OTP in {timer} seconds
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                      <Text style={styles.resendText}>🔄 Resend OTP</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.backButton}
                  onPress={() => setStep('phone')}>
                  <Text style={styles.backButtonText}>← Change Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Features */}
          <View style={styles.footer}>
            <View style={styles.featuresContainer}>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🏆</Text>
                <Text style={styles.featureText}>Win Real Money</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>⚡</Text>
                <Text style={styles.featureText}>Instant Payouts</Text>
              </View>
              <View style={styles.feature}>
                <Text style={styles.featureIcon}>🔒</Text>
                <Text style={styles.featureText}>100% Secure</Text>
              </View>
            </View>
            
            <Text style={styles.footerText}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: theme.spacing.md,
    minHeight: theme.screen.height * 0.9,
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  logoEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 2,
    textShadowColor: 'rgba(255, 107, 53, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.accent,
    fontWeight: '600',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: theme.spacing.sm,
  },
  formCard: {
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    marginBottom: theme.spacing.md,
  },
  formHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  formTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  label: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textDark,
    marginBottom: theme.spacing.xs,
  },
  otpInput: {
    fontSize: 24,
    letterSpacing: 6,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  phoneDisplay: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonDisabled: {
    backgroundColor: theme.colors.textLight,
    ...theme.shadows.small,
  },
  resendContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing.sm,
  },
  resendButton: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
  },
  timerText: {
    color: theme.colors.textLight,
    fontSize: theme.fonts.sizes.sm,
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  backButton: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  backButtonText: {
    color: theme.colors.danger,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  featureText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  footerText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
});

export default AuthScreen;