import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Share,
  Clipboard,
  Alert,
  RefreshControl,
} from 'react-native';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';
import { useAuth } from '../context/AuthContext';
import config from '../config/config';

const ReferralScreen = ({ navigation }) => {
  const { user, token } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    referredUsers: []
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchReferralData();
  }, []);

  const fetchReferralData = async () => {
    try {
      const response = await fetch(`${config.SERVER_URL}/api/profile/referral`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReferralCode(data.referralCode);
        setReferralStats(data.stats);
      } else {
        console.error('Failed to fetch referral data');
      }
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReferralData();
    setRefreshing(false);
  };

  const copyReferralCode = () => {
    Clipboard.setString(referralCode);
    Alert.alert('Copied!', 'Referral code copied to clipboard');
  };

  const shareReferral = async () => {
    try {
      const message = `🎮 Join me on Budzee - The ultimate gaming platform! 

Use my referral code: ${referralCode}

🎁 Get ₹50 bonus when you sign up
🎲 Play exciting games like Ludo & Memory
💰 Win real money prizes

Download now and start winning!`;

      await Share.share({
        message: message,
        title: 'Join Budzee Gaming',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleBackPress = () => {
    console.log('Back button pressed in ReferralScreen');
    navigation.navigate('Home');
  };

  return (
    <GradientBackground>
      <CommonHeader
        title="Refer & Earn"
        subtitle="Invite friends and earn rewards"
        icon="🎁"
        onBackPress={handleBackPress}
      />
      
      <ScrollView 
        style={commonStyles.scrollContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }>
        
        {/* Referral Code Section */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Your Referral Code</Text>
          <View style={[commonStyles.card, styles.codeCard]}>
            <View style={styles.codeContainer}>
              <Text style={styles.codeLabel}>Share this code with friends:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={copyReferralCode}>
                  <Text style={styles.copyButtonText}>📋 Copy</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <TouchableOpacity style={[commonStyles.button, styles.shareButton]} onPress={shareReferral}>
              <Text style={commonStyles.buttonText}>📤 Share with Friends</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Earnings Summary */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Your Earnings</Text>
          <View style={styles.statsGrid}>
            <View style={[commonStyles.card, styles.statCard]}>
              <Text style={styles.statIcon}>👥</Text>
              <Text style={styles.statValue}>{referralStats.totalReferrals}</Text>
              <Text style={styles.statLabel}>Total Referrals</Text>
            </View>
            
            <View style={[commonStyles.card, styles.statCard]}>
              <Text style={styles.statIcon}>💰</Text>
              <Text style={styles.statValue}>₹{referralStats.totalEarnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Total Earned</Text>
            </View>
            
            <View style={[commonStyles.card, styles.statCard]}>
              <Text style={styles.statIcon}>⏳</Text>
              <Text style={styles.statValue}>₹{referralStats.pendingEarnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* How it Works */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>How it Works</Text>
          <View style={commonStyles.card}>
            <View style={styles.stepContainer}>
              <View style={styles.step}>
                <Text style={styles.stepNumber}>1</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Share Your Code</Text>
                  <Text style={styles.stepDescription}>Send your referral code to friends</Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>2</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Friend Signs Up</Text>
                  <Text style={styles.stepDescription}>They register using your code</Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>3</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Both Get Rewards</Text>
                  <Text style={styles.stepDescription}>You get ₹25, they get ₹50 bonus</Text>
                </View>
              </View>
              
              <View style={styles.step}>
                <Text style={styles.stepNumber}>4</Text>
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Extra Bonus</Text>
                  <Text style={styles.stepDescription}>Get 5% of their first game winnings</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Referred Users */}
        {referralStats.referredUsers.length > 0 && (
          <View style={styles.section}>
            <Text style={commonStyles.sectionTitle}>Your Referrals</Text>
            <View style={commonStyles.card}>
              {referralStats.referredUsers.map((user, index) => (
                <View key={index} style={styles.referredUser}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userDate}>Joined: {new Date(user.joinedAt).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.userEarnings}>
                    <Text style={styles.earningsAmount}>₹{user.earnings.toFixed(2)}</Text>
                    <Text style={styles.earningsLabel}>Earned</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Terms */}
        <View style={styles.section}>
          <View style={[commonStyles.card, styles.termsCard]}>
            <Text style={styles.termsTitle}>📋 Terms & Conditions</Text>
            <Text style={styles.termsText}>
              • Referral bonus is credited after friend's first deposit{'\n'}
              • Minimum withdrawal amount is ₹100{'\n'}
              • Bonus earnings from referrals are subject to 1x wagering{'\n'}
              • Fraudulent referrals will result in account suspension{'\n'}
              • Budzee reserves the right to modify terms
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: theme.spacing.sm,
  },
  codeCard: {
    alignItems: 'center',
  },
  codeContainer: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  codeLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  codeText: {
    flex: 1,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    letterSpacing: 2,
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  copyButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
  },
  shareButton: {
    backgroundColor: theme.colors.success,
    minWidth: 200,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  statIcon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  stepContainer: {
    gap: theme.spacing.sm,
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
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
    marginRight: theme.spacing.sm,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  stepDescription: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
  },
  referredUser: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.backgroundLight,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.textDark,
  },
  userDate: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    marginTop: 2,
  },
  userEarnings: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  earningsLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
  },
  termsCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
  },
  termsTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginBottom: theme.spacing.sm,
  },
  termsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    lineHeight: 18,
  },
});

export default ReferralScreen;