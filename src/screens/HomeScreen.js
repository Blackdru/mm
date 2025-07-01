import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useWallet} from '../context/WalletContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const HomeScreen = ({navigation}) => {
  const {user, logout} = useAuth();
  const {balance, fetchBalance} = useWallet();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBalance();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    setRefreshing(false);
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
      id: 'classic_ludo',
      name: 'Classic Ludo',
      description: 'Traditional board game for 2-4 players',
      image: '🎲',
      minPlayers: 2,
      maxPlayers: 4,
      available: true,
    },
    {
      id: 'fast_ludo',
      name: 'Fast Ludo',
      description: 'Quick points-based Ludo with timer',
      image: '⚡',
      minPlayers: 2,
      maxPlayers: 4,
      available: true,
    },
    {
      id: 'snakes_ladders',
      name: 'Snakes & Ladders',
      description: 'Classic board game with snakes and ladders',
      image: '🐍',
      minPlayers: 2,
      maxPlayers: 4,
      available: true,
    },
    {
      id: 'memory',
      name: 'Mind Morga',
      description: 'Memory card matching for 2 players',
      image: '🧠',
      minPlayers: 2,
      maxPlayers: 2,
      available: true,
    },
  ];

  return (
    <GradientBackground>
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
        
        {/* User Header */}
        <View style={[commonStyles.card, styles.headerCard]}>
          <View style={[commonStyles.row, commonStyles.spaceBetween]}>
            <View style={[commonStyles.row, styles.userSection]}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : '🎮'}
                </Text>
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.welcomeText}>Welcome back!</Text>
                <Text style={styles.userName}>
                  {user?.name || 'Gamer'}
                </Text>
                <Text style={styles.userPhone}>{user?.phoneNumber}</Text>
              </View>
            </View>
            
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Section */}
        <View style={[commonStyles.card, styles.walletCard]}>
          <View style={styles.walletHeader}>
            <Text style={styles.walletIcon}>💎</Text>
            <Text style={styles.walletLabel}>Gaming Wallet</Text>
          </View>
          <Text style={styles.walletAmount}>₹{balance.toFixed(2)}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.walletButton]}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={commonStyles.buttonText}>💰 Manage Wallet</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.addMoneyBtn]}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.actionIcon}>💳</Text>
            <Text style={styles.actionText}>Add Money</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.profileBtn]}
            onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.referralBtn]}
            onPress={() => navigation.navigate('Referral')}>
            <Text style={styles.actionIcon}>🎁</Text>
            <Text style={styles.actionText}>Refer & Earn</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.actionButton, styles.statsBtn]}>
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Stats</Text>
          </TouchableOpacity>
        </View>

        {/* Games Section */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>🎮 Choose Your Battle</Text>
          
          <View style={styles.gamesGrid}>
            {games.map((game) => (
              <TouchableOpacity
                key={game.id}
                style={[
                  styles.gameCard,
                  !game.available && styles.gameCardDisabled,
                ]}
                onPress={() => {
                  if (game.available) {
                    navigation.navigate('PlayerSelection', {game});
                  } else {
                    Alert.alert('Coming Soon', `${game.name} will be available soon!`);
                  }
                }}
                disabled={!game.available}>
                <View style={styles.gameImageContainer}>
                  <Text style={styles.gameImage}>{game.image}</Text>
                </View>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDescription}>{game.description}</Text>
                {game.available && (
                  <View style={styles.playNowBadge}>
                    <Text style={styles.playNowText}>Play Now!</Text>
                  </View>
                )}
                {!game.available && (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming Soon</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Start */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>🚀 Quick Start</Text>
          <View style={[commonStyles.card, styles.quickStartCard]}>
            <Text style={styles.quickStartText}>Ready to play?</Text>
            <TouchableOpacity 
              style={[commonStyles.button, styles.startGameBtn]}
              onPress={() => navigation.navigate('PlayerSelection', {game: games[0]})}>
              <Text style={commonStyles.buttonText}>🎲 Play Classic Ludo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    marginTop: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
  },
  userSection: {
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    ...theme.shadows.small,
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
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  userName: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginVertical: theme.spacing.xs,
  },
  userPhone: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.small,
  },
  logoutText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  walletCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  walletHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
  },
  walletIcon: {
    fontSize: 24,
    marginRight: theme.spacing.xs,
  },
  walletLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  walletAmount: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  walletButton: {
    backgroundColor: theme.colors.success,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    gap: theme.spacing.xs,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.small,
    minHeight: 60,
    justifyContent: 'center',
  },
  addMoneyBtn: {
    backgroundColor: theme.colors.success,
  },
  profileBtn: {
    backgroundColor: theme.colors.secondary,
  },
  referralBtn: {
    backgroundColor: theme.colors.accent,
  },
  statsBtn: {
    backgroundColor: theme.colors.primaryLight,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  actionText: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  section: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  gameCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
    position: 'relative',
    minHeight: 120,
  },
  gameCardDisabled: {
    opacity: 0.6,
  },
  gameImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  gameImage: {
    fontSize: 24,
  },
  gameName: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  gameDescription: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  playNowBadge: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: theme.colors.success,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  playNowText: {
    fontSize: 10,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: theme.colors.warning,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  comingSoonText: {
    fontSize: 10,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  quickStartCard: {
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  quickStartText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  startGameBtn: {
    marginTop: theme.spacing.xs,
    minWidth: 200,
  },
});

export default HomeScreen;