import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useWallet} from '../context/WalletContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const { width } = Dimensions.get('window');

const HomeScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const {balance, transactions, fetchBalance, fetchTransactions} = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    await fetchTransactions();
    setRefreshing(false);
  };

  const calculateGamesWon = () => {
    if (!Array.isArray(transactions)) return 0;
    return transactions.filter(t => t.type === 'GAME_WINNING' && t.status === 'COMPLETED').length;
  };

  const calculateTotalWinnings = () => {
    if (!Array.isArray(transactions)) return '0';
    return transactions
      .filter(t => t.type === 'GAME_WINNING' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
      .toFixed(0);
  };

  const calculateWinRate = () => {
    if (!Array.isArray(transactions)) return 0;
    const gamesPlayed = transactions.filter(t => t.type === 'GAME_ENTRY' && t.status === 'COMPLETED').length;
    const gamesWon = calculateGamesWon();
    return gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Logout', onPress: logout, style: 'destructive'},
      ]
    );
  };

  const games = [
    {
      id: 'memory',
      name: 'Mind Morga',
      description: 'Memory card matching battles',
      emoji: '🧠',
      minPlayers: 2,
      maxPlayers: 2,
      available: true,
      prize: 'Starting from ₹5',
      difficulty: 'Easy to Master',
    },
  ];

  return (
    <GradientBackground>
      <SafeAreaView style={commonStyles.safeContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
              colors={[theme.colors.primary]}
            />
          }>
          
          {/* Attractive Header */}
          <View style={styles.header}>
            <View style={styles.userSection}>
              <View style={styles.userInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : '🎮'}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.welcomeText}>Welcome back,</Text>
                  <Text style={styles.userName}>{user?.name || 'Gaming Champion'}</Text>
                  <Text style={styles.userStatus}>🟢 Online • Ready to play</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Attractive Wallet Card */}
          <View style={[commonStyles.attractiveCard, styles.walletCard]}>
            <View style={styles.walletHeader}>
              <View style={styles.walletIconContainer}>
                <Text style={styles.walletIcon}>💎</Text>
              </View>
              <View style={styles.walletInfo}>
                <Text style={styles.walletLabel}>Gaming Wallet</Text>
                <Text style={styles.walletAmount}>₹{(balance || 0).toFixed(2)}</Text>
              </View>
              <TouchableOpacity
                style={styles.addMoneyButton}
                onPress={() => navigation.navigate('Wallet')}>
                <Text style={styles.addMoneyText}>Open Wallet</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.walletStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{calculateGamesWon()}</Text>
                <Text style={styles.statLabel}>Games Won</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>₹{calculateTotalWinnings()}</Text>
                <Text style={styles.statLabel}>Total Winnings</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{calculateWinRate()}%</Text>
                <Text style={styles.statLabel}>Win Rate</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions Grid */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryAction]}
                onPress={() => navigation.navigate('Wallet')}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>💳</Text>
                </View>
                <Text style={styles.actionText}>Wallet</Text>
                <Text style={styles.actionSubtext}>Manage funds</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryAction]}
                onPress={() => navigation.navigate('Profile')}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>👤</Text>
                </View>
                <Text style={styles.actionText}>Profile</Text>
                <Text style={styles.actionSubtext}>Edit details</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.accentAction]}
                onPress={() => navigation.navigate('Referral')}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>🎁</Text>
                </View>
                <Text style={styles.actionText}>Refer</Text>
                <Text style={styles.actionSubtext}>Earn rewards</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.infoAction]}
                onPress={() => navigation.navigate('Settings')}>
                <View style={styles.actionIconContainer}>
                  <Text style={styles.actionIcon}>⚙️</Text>
                </View>
                <Text style={styles.actionText}>Settings</Text>
                <Text style={styles.actionSubtext}>App settings</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Featured Games Section */}
          <View style={styles.gamesSection}>
            <Text style={styles.sectionTitle}>🎮 Featured Games</Text>
            
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={[commonStyles.attractiveCard, styles.gameCard]}
                onPress={() => {
                  if (game.available) {
                    navigation.navigate('PlayerSelection', {game});
                  } else {
                    Alert.alert('Coming Soon', `${game.name} will be available soon!`);
                  }
                }}
                disabled={!game.available}>
                
                <View style={styles.gameHeader}>
                  <View style={styles.gameIconContainer}>
                    <Text style={styles.gameIcon}>{game.emoji}</Text>
                  </View>
                  <View style={styles.gameInfo}>
                    <View style={styles.gameNameRow}>
                      <Text style={styles.gameName}>{game.name}</Text>
                      <View style={styles.prizeBadge}>
                        <Text style={styles.prizeText}>{game.prize}</Text>
                      </View>
                    </View>
                    <Text style={styles.gameDescription}>{game.description}</Text>
                    <Text style={styles.gameDifficulty}>🎯 {game.difficulty}</Text>
                  </View>
                </View>
                
                <View style={styles.gameFooter}>
                  <View style={styles.gameDetails}>
                    <Text style={styles.gameDetailText}>👥 {game.maxPlayers} Players</Text>
                    <Text style={styles.gameDetailText}>⚡ Quick Match</Text>
                    <Text style={styles.gameDetailText}>🏆 Winner Takes 80%</Text>
                  </View>
                  
                  <View style={styles.playButtonContainer}>
                    <Text style={styles.playButtonText}>🚀 PLAY NOW</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          {/* Quick Play CTA */}
          <View style={styles.ctaSection}>
            <TouchableOpacity 
              style={[commonStyles.largeButton, styles.quickPlayButton]}
              onPress={() => navigation.navigate('PlayerSelection', {game: games[0]})}>
              <Text style={[commonStyles.largeButtonText, styles.quickPlayText]}>
                🎮 Start Playing Mind Morga
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.ctaSubtext}>
              Join thousands of players competing for real money prizes!
            </Text>
          </View>

          {/* Gaming Tips */}
          <View style={[commonStyles.card, styles.tipsCard]}>
            <Text style={styles.tipsTitle}>💡 Pro Gaming Tips</Text>
            <View style={styles.tipsList}>
              <Text style={styles.tipItem}>🧠 Practice memory techniques to improve your game</Text>
              <Text style={styles.tipItem}>⚡ Start with smaller amounts to build confidence</Text>
              <Text style={styles.tipItem}>🎯 Focus and concentration are key to winning</Text>
              <Text style={styles.tipItem}>💰 Manage your bankroll wisely for long-term success</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xxxl,
  },
  
  header: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  welcomeText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginVertical: 2,
  },
  userStatus: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSuccess,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.small,
  },
  logoutText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  
  walletCard: {
    marginBottom: theme.spacing.xl,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  walletIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.small,
  },
  walletIcon: {
    fontSize: 24,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  walletAmount: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  addMoneyButton: {
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.successShadow,
  },
  addMoneyText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  
  walletStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: theme.colors.border,
  },
  
  quickActionsSection: {
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    ...theme.shadows.small,
  },
  primaryAction: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryLight,
  },
  secondaryAction: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondaryLight,
  },
  accentAction: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accentLight,
  },
  infoAction: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.info,
  },
  actionIconContainer: {
    marginBottom: theme.spacing.sm,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textPrimary,
    opacity: 0.8,
    textAlign: 'center',
  },
  
  gamesSection: {
    marginBottom: theme.spacing.xl,
  },
  gameCard: {
    marginBottom: theme.spacing.md,
  },
  gameHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.lg,
  },
  gameIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  gameIcon: {
    fontSize: 28,
  },
  gameInfo: {
    flex: 1,
  },
  gameNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  gameName: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  prizeBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  prizeText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  gameDescription: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
    lineHeight: 20,
  },
  gameDifficulty: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSuccess,
    fontWeight: '600',
  },
  
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  gameDetails: {
    flex: 1,
  },
  gameDetailText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  playButtonContainer: {
    backgroundColor: theme.colors.secondary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    ...theme.shadows.successShadow,
  },
  playButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  
  ctaSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  quickPlayButton: {
    width: '100%',
    marginBottom: theme.spacing.md,
  },
  quickPlayText: {
    fontSize: theme.fonts.sizes.lg,
  },
  ctaSubtext: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 20,
  },
  
  tipsCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
    marginBottom: theme.spacing.xl,
  },
  tipsTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  tipsList: {
    gap: theme.spacing.md,
  },
  tipItem: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default HomeScreen;