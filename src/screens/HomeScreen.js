import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useWallet} from '../context/WalletContext';

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
      id: 'ludo',
      name: 'Ludo',
      description: 'Classic board game for 2-4 players',
      image: '🎲',
      minPlayers: 2,
      maxPlayers: 4,
      available: true,
    },
    {
      id: 'snake_ladder',
      name: 'Snake & Ladder',
      description: 'Coming Soon',
      image: '🐍',
      available: false,
    },
    {
      id: 'carrom',
      name: 'Carrom',
      description: 'Coming Soon',
      image: '🎯',
      available: false,
    },
    {
      id: 'chess',
      name: 'Chess',
      description: 'Coming Soon',
      image: '♟️',
      available: false,
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '👤'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {user?.name || 'Player'}
            </Text>
            <Text style={styles.userPhone}>{user?.phoneNumber}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Wallet Section */}
      <View style={styles.walletSection}>
        <View style={styles.walletCard}>
          <View style={styles.walletInfo}>
            <Text style={styles.walletLabel}>Wallet Balance</Text>
            <Text style={styles.walletAmount}>₹{balance.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.walletButton}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.walletButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Wallet')}>
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionText}>Add Money</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionText}>Profile</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🏆</Text>
          <Text style={styles.actionText}>Leaderboard</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionText}>Stats</Text>
        </TouchableOpacity>
      </View>

      {/* Games Section */}
      <View style={styles.gamesSection}>
        <Text style={styles.sectionTitle}>Choose Your Game</Text>
        
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
              {!game.available && (
                <View style={styles.comingSoonBadge}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Games */}
      <View style={styles.recentSection}>
        <Text style={styles.sectionTitle}>Recent Games</Text>
        <View style={styles.recentCard}>
          <Text style={styles.recentText}>No recent games</Text>
          <Text style={styles.recentSubtext}>Start playing to see your game history</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  userPhone: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  logoutButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e74c3c',
  },
  logoutText: {
    color: '#e74c3c',
    fontSize: 14,
    fontWeight: '600',
  },
  walletSection: {
    padding: 20,
  },
  walletCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  walletInfo: {
    flex: 1,
  },
  walletLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  walletAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  walletButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  walletButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    minWidth: 70,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#2c3e50',
    fontWeight: '500',
  },
  gamesSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gameCardDisabled: {
    opacity: 0.6,
  },
  gameImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameImage: {
    fontSize: 30,
  },
  gameName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  comingSoonBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f39c12',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  recentSection: {
    padding: 20,
  },
  recentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentText: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  recentSubtext: {
    fontSize: 12,
    color: '#95a5a6',
  },
});

export default HomeScreen;