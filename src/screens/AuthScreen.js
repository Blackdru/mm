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
  SafeAreaView,
  Image,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import config from '../config/config';

const AuthScreen = ({navigation}) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);

  const {sendOTP, verifyOTP} = useAuth();

  const formatPhoneNumber = (text) => {
    const cleaned = text.replace(/\D/g, '');
    
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

    // First try to verify OTP to check if user exists
    setLoading(true);
    try {
      const checkResponse = await fetch(`${config.API_BASE_URL}/auth/check-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });
      
      const checkData = await checkResponse.json();
      setLoading(false);
      
      if (checkData.isNewUser) {
        // Show consent screen for new users only
        navigation.navigate('UserConsent', {
          onAccept: () => {
            navigation.navigate('ReferralCode', {
              phoneNumber,
              otp,
              onComplete: (referralCode) => {
                verifyOTPWithReferral(referralCode);
              }
            });
          }
        });
      } else {
        // Existing user - directly verify OTP
        verifyOTPWithReferral(null);
      }
    } catch (error) {
      setLoading(false);
      // If check fails, proceed with normal flow
      verifyOTPWithReferral(null);
    }
  };

  const verifyOTPWithReferral = async (referralCode) => {
    setLoading(true);
    try {
      const result = await verifyOTP(phoneNumber, otp, referralCode);
      setLoading(false);

      if (result.success) {
        console.log('OTP verification successful');
        if (referralCode) {
          Alert.alert('Success!', 'Account created successfully! You and your friend have received ₹25 bonus credits.');
        }
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
      <SafeAreaView style={commonStyles.safeContainer}>
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.scrollContainer}>
            
            {/* Attractive Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logoCircle}>
                  <Image 
                    source={require('../ic_launcher_round.png')}
                    style={styles.logoImage}
                    resizeMode="cover"
                  />
                </View>
                <Text style={styles.tagline}>Crazy Rewards</Text>
              </View>
              
              <View style={styles.welcomeContainer}>
                <Text style={styles.welcomeTitle}>
                  {step === 'phone' ? 'Welcome to Budzee!' : 'Verify Your Number'}
                </Text>
                <Text style={styles.welcomeSubtitle}>
                  {step === 'phone'
                    ? 'Enter your mobile number to start !'
                    : `We've sent a 6-digit OTP to ${phoneNumber}`}
                </Text>
              </View>
            </View>

            {/* Attractive Form Card */}
            <View style={[commonStyles.attractiveCard, styles.formCard]}>
              {step === 'phone' ? (
                <>
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>📱 Mobile Number</Text>
                    <TextInput
                      style={[commonStyles.input, styles.phoneInput]}
                      placeholder="Enter 10-digit mobile number"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={phoneNumber}
                      onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                      keyboardType="phone-pad"
                      maxLength={13}
                      editable={!loading}
                    />
                    <Text style={styles.inputHint}>
                      We'll send you a verification code
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[commonStyles.largeButton, loading && styles.buttonDisabled]}
                    onPress={handleSendOTP}
                    disabled={loading}>
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                        <Text style={[commonStyles.largeButtonText, styles.loadingText]}>
                          Sending OTP...
                        </Text>
                      </View>
                    ) : (
                      <Text style={commonStyles.largeButtonText}>🚀 Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>🔐 Enter OTP</Text>
                    <View style={styles.phoneDisplayContainer}>
                      <Text style={styles.phoneDisplayLabel}>Sent to:</Text>
                      <Text style={styles.phoneDisplay}>{phoneNumber}</Text>
                    </View>
                    
                    <TextInput
                      style={[commonStyles.input, styles.otpInput]}
                      placeholder="000000"
                      placeholderTextColor={theme.colors.textTertiary}
                      value={otp}
                      onChangeText={setOtp}
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                      textAlign="center"
                    />
                    
                    <Text style={styles.inputHint}>
                      Enter the 6-digit code we sent you
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    style={[commonStyles.largeButton, loading && styles.buttonDisabled]}
                    onPress={handleVerifyOTP}
                    disabled={loading}>
                    {loading ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                        <Text style={[commonStyles.largeButtonText, styles.loadingText]}>
                          Verifying...
                        </Text>
                      </View>
                    ) : (
                      <Text style={commonStyles.largeButtonText}>✅ Verify & Continue</Text>
                    )}
                  </TouchableOpacity>

                  {/* Resend Section */}
                  <View style={styles.resendSection}>
                    {timer > 0 ? (
                      <Text style={styles.timerText}>
                        Resend OTP in {timer} seconds
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={handleResendOTP} style={styles.resendButton}>
                        <Text style={styles.resendText}>🔄 Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Change Number */}
                  <TouchableOpacity
                    style={styles.changeNumberButton}
                    onPress={() => setStep('phone')}>
                    <Text style={styles.changeNumberText}>📝 Change Number</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Compact Features Section */}
            <View style={styles.featuresSection}>
              <Text style={styles.featuresTitle}>🌟 Why Choose Budzee?</Text>
              <View style={styles.featuresRow}>
                <View style={styles.featureItemCompact}>
                  <Text style={styles.featureIcon}>🏆</Text>
                  <Text style={styles.featureTitle}>Win Real Money</Text>
                </View>
                
                <View style={styles.featureItemCompact}>
                  <Text style={styles.featureIcon}>⚡</Text>
                  <Text style={styles.featureTitle}>Instant Payouts</Text>
                </View>
                
                <View style={styles.featureItemCompact}>
                  <Text style={styles.featureIcon}>🔒</Text>
                  <Text style={styles.featureTitle}>100% Secure</Text>
                </View>
              </View>
            </View>
          </View>
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    ...theme.shadows.primaryShadow,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 40,
  },
  appName: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.accent,
    fontWeight: '600',
  },
  
  welcomeContainer: {
    alignItems: 'center',
  },
  welcomeTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: theme.spacing.sm,
  },
  
  formCard: {
    marginBottom: theme.spacing.sm,
  },
  inputSection: {
    marginBottom: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  phoneInput: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  otpInput: {
    fontSize: theme.fonts.sizes.xl,
    letterSpacing: 4,
    textAlign: 'center',
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  inputHint: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: theme.spacing.sm,
    fontStyle: 'italic',
  },
  
  phoneDisplayContainer: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phoneDisplayLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  phoneDisplay: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  
  buttonDisabled: {
    backgroundColor: theme.colors.textLight,
    opacity: 0.6,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: theme.spacing.sm,
  },
  
  resendSection: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  resendButton: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  timerText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
  },
  resendText: {
    color: theme.colors.secondary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  
  changeNumberButton: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  changeNumberText: {
    color: theme.colors.textTertiary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '500',
  },
  
  featuresSection: {
    marginTop: theme.spacing.sm,
  },
  featuresTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  featuresRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  featureItemCompact: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  featureIcon: {
    fontSize: 14,
  },
  featureTitle: {
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
});

export default AuthScreen;