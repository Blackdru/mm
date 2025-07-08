import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Share,
  Clipboard,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';
import config from '../config/config';

const ReferralScreen = ({navigation}) => {
  const {user, token} = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReferralData();
  }, [user]);

  const fetchReferralData = async () => {
    try {
      setLoading(true);

      if (!token) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.API_BASE_URL}/profile/referral`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setReferralCode(data.referralCode || '');
        setReferralStats({
          totalReferrals: data.stats?.totalReferrals || 0,
          totalEarnings: data.stats?.totalEarnings || 0,
          pendingEarnings: data.stats?.pendingEarnings || 0,
        });
      } else {
        console.error('Failed to fetch referral data:', data.message);
        // Fallback for existing users without referral codes
        if (user?.referralCode) {
          setReferralCode(user.referralCode);
        }
      }
    } catch (error) {
      console.error('Fetch referral data error:', error);
      // Fallback for existing users without referral codes
      if (user?.referralCode) {
        setReferralCode(user.referralCode);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    try {
      await Clipboard.setString(referralCode);
      Alert.alert('Copied!', 'Referral code copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy referral code');
    }
  };

  const handleShareCode = async () => {
    try {
      const shareMessage = `🎮 Join me on Budzee Gaming App and win real money! 

Use my referral code: ${referralCode}

💰 You get ₹25 bonus on signup
🎁 I get ₹25 when you join

Download now: https://klikgames.in

#BudzeeGaming #RealMoney #Gaming`;

      await Share.share({
        message: shareMessage,
        title: 'Join Budzee Gaming App',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share referral code');
    }
  };

  const rewards = [
    {
      icon: '🎁',
      title: 'Sign Up Bonus',
      description: 'Friend gets ₹25 on registration',
      amount: '₹25',
      color: theme.colors.success,
    },
    {
      icon: '💰',
      title: 'First Game Bonus',
      description: 'You get ₹25 when they play',
      amount: '₹25',
      color: theme.colors.primary,
    },
    {
      icon: '🏆',
      title: 'Lifetime Earnings',
      description: '5% of their game fees forever',
      amount: '5%',
      color: theme.colors.accent,
    },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title="Refer & Earn"
          subtitle="Invite friends and earn rewards"
          icon="🎁"
          onBackPress={() => navigation.navigate('Home')}
        />

        {/* Referral Code Section */}
        <View style={styles.codeSection}>
          <View style={[commonStyles.attractiveCard, styles.codeCard]}>
            <View style={styles.codeHeader}>
              <View style={styles.codeIconContainer}>
                <Text style={styles.codeIcon}>🔗</Text>
              </View>
              <Text style={styles.codeTitle}>Your Referral Code</Text>
            </View>
            
            <View style={styles.codeDisplay}>
              {loading ? (
                <ActivityIndicator color={theme.colors.primary} size="large" />
              ) : (
                <Text style={styles.codeText}>{referralCode || 'Loading...'}</Text>
              )}
            </View>
            
            <View style={styles.codeActions}>
              <TouchableOpacity
                style={[styles.codeButton, styles.copyButton, loading && styles.buttonDisabled]}
                onPress={handleCopyCode}
                disabled={loading || !referralCode}>
                <Text style={styles.copyButtonText}>📋 Copy Code</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.codeButton, styles.shareButton, loading && styles.buttonDisabled]}
                onPress={handleShareCode}
                disabled={loading || !referralCode}>
                <Text style={styles.shareButtonText}>📤 Share Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.earningsValue]}>
                ₹{referralStats.totalEarnings}
              </Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, styles.pendingValue]}>
                ₹{referralStats.pendingEarnings}
              </Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Rewards Section */}
        <View style={styles.rewardsSection}>
          <Text style={styles.sectionTitle}>💎 Referral Rewards</Text>
          
          <View style={styles.rewardsList}>
            {rewards.map((reward, index) => (
              <View key={index} style={[styles.rewardCard, { borderLeftColor: reward.color }]}>
                <View style={styles.rewardHeader}>
                  <Text style={styles.rewardIcon}>{reward.icon}</Text>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardDescription}>{reward.description}</Text>
                  </View>
                  <Text style={[styles.rewardAmount, { color: reward.color }]}>
                    {reward.amount}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.howItWorksSection}>
          <Text style={styles.sectionTitle}>🚀 How It Works</Text>
          
          <View style={styles.stepsList}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Share your referral code with friends</Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>They sign up using your code</Text>
            </View>
            
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>Earn instant rewards!</Text>
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
  
  codeSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  codeCard: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  codeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  codeIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.primaryShadow,
  },
  codeIcon: {
    fontSize: 24,
  },
  codeTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  codeDisplay: {
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  codeText: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  codeButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  copyButton: {
    backgroundColor: theme.colors.secondary,
  },
  shareButton: {
    backgroundColor: theme.colors.accent,
  },
  copyButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  shareButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  
  statsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  earningsValue: {
    color: theme.colors.success,
  },
  pendingValue: {
    color: theme.colors.warning,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  
  rewardsSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  rewardsList: {
    gap: theme.spacing.sm,
  },
  rewardCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  rewardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rewardIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  rewardDescription: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  rewardAmount: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
  },
  
  howItWorksSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  stepsList: {
    gap: theme.spacing.md,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  stepNumberText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  stepText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
});

export default ReferralScreen;