import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import {useWallet} from '../context/WalletContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const { width, height } = Dimensions.get('window');

const AmountSelectionScreen = ({navigation, route}) => {
  const {game, playerCount} = route.params;
  const {balance} = useWallet();
  const [selectedAmount, setSelectedAmount] = useState(null);

  const amountOptions = [
    {
      amount: 10,
      title: '₹10',
      subtitle: 'Beginner',
      prizePool: 10 * playerCount * 0.9,
      popular: false,
    },
    {
      amount: 25,
      title: '₹25',
      subtitle: 'Casual',
      prizePool: 25 * playerCount * 0.9,
      popular: true,
    },
    {
      amount: 50,
      title: '₹50',
      subtitle: 'Competitive',
      prizePool: 50 * playerCount * 0.9,
      popular: false,
    },
    {
      amount: 100,
      title: '₹100',
      subtitle: 'Pro',
      prizePool: 100 * playerCount * 0.9,
      popular: false,
    },
    {
      amount: 250,
      title: '₹250',
      subtitle: 'Expert',
      prizePool: 250 * playerCount * 0.9,
      popular: false,
    },
    {
      amount: 500,
      title: '₹500',
      subtitle: 'Master',
      prizePool: 500 * playerCount * 0.9,
      popular: false,
    },
  ];

  const handleAmountSelection = (amount) => {
    if (balance < amount) {
      Alert.alert(
        'Insufficient Balance',
        `You need ₹${amount} to join this game. Your current balance is ₹${balance.toFixed(2)}. Would you like to add money to your wallet?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Add Money',
            onPress: () => navigation.navigate('Wallet'),
          },
        ]
      );
      return;
    }

    setSelectedAmount(amount);
    navigation.navigate('Matchmaking', {
      game,
      playerCount,
      entryFee: amount,
    });
  };

  return (
    <GradientBackground>
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Gaming Header */}
        <View style={styles.headerCard}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          
          <View style={styles.gameInfo}>
            <Text style={styles.gameIcon}>{game.image}</Text>
            <Text style={styles.gameTitle}>{game.name} - {playerCount} Players</Text>
            <Text style={styles.gameSubtitle}>💰 Select entry amount</Text>
          </View>
        </View>

      {/* Wallet Balance */}
      <View style={styles.balanceContainer}>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Wallet Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          <TouchableOpacity
            style={styles.addMoneyButton}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={styles.addMoneyText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Amount Options */}
      <View style={styles.optionsContainer}>
        <Text style={styles.sectionTitle}>Choose Entry Amount</Text>
        
        <View style={styles.optionsGrid}>
          {amountOptions.map((option) => {
            const canAfford = balance >= option.amount;
            
            return (
              <TouchableOpacity
                key={option.amount}
                style={[
                  styles.optionCard,
                  selectedAmount === option.amount && styles.optionCardSelected,
                  !canAfford && styles.optionCardDisabled,
                ]}
                onPress={() => handleAmountSelection(option.amount)}
                disabled={!canAfford}>
                
                {option.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>POPULAR</Text>
                  </View>
                )}
                
                <Text style={styles.optionAmount}>{option.title}</Text>
                <Text style={styles.optionSubtitle}>{option.subtitle}</Text>
                
                <View style={styles.prizeInfo}>
                  <Text style={styles.prizeLabel}>Win up to</Text>
                  <Text style={styles.prizeAmount}>₹{option.prizePool.toFixed(0)}</Text>
                </View>
                
                {!canAfford && (
                  <View style={styles.insufficientOverlay}>
                    <Text style={styles.insufficientText}>Insufficient Balance</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Game Details */}
      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>Game Details</Text>
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Game:</Text>
            <Text style={styles.detailValue}>{game.name}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Players:</Text>
            <Text style={styles.detailValue}>{playerCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform Fee:</Text>
            <Text style={styles.detailValue}>10%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Winner Gets:</Text>
            <Text style={styles.detailValue}>90% of Prize Pool</Text>
          </View>
        </View>
      </View>

      {/* Terms */}
      <View style={styles.termsContainer}>
        <Text style={styles.termsTitle}>Important Notes</Text>
        <Text style={styles.termsText}>
          • Entry fee will be deducted from your wallet immediately{'\n'}
          • Game will start once all players join{'\n'}
          • Winner gets 90% of the total prize pool{'\n'}
          • 10% platform fee applies to all games{'\n'}
          • Refund available if game doesn't start within 5 minutes
        </Text>
      </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flex: 1,
  },
  headerCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.large,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  backButton: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    ...theme.shadows.small,
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  gameInfo: {
    alignItems: 'center',
  },
  gameIcon: {
    fontSize: 56,
    marginBottom: theme.spacing.sm,
  },
  gameTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 53, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  gameSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceContainer: {
    padding: 20,
  },
  balanceCard: {
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
  balanceLabel: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 12,
  },
  addMoneyButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addMoneyText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  optionsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionCard: {
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
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
  },
  optionCardSelected: {
    borderColor: '#3498db',
    backgroundColor: '#f8f9ff',
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  popularText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  optionSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 12,
  },
  prizeInfo: {
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: 12,
    color: '#7f8c8d',
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
  },
  insufficientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insufficientText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailsContainer: {
    padding: 20,
  },
  detailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  detailValue: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  termsContainer: {
    margin: 20,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#f39c12',
  },
  termsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#856404',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 12,
    color: '#856404',
    lineHeight: 18,
  },
});

export default AmountSelectionScreen;