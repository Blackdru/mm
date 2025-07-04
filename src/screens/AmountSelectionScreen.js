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
import CommonHeader from '../components/CommonHeader';

const { width } = Dimensions.get('window');

const AmountSelectionScreen = ({navigation, route}) => {
  const {game, playerCount} = route.params;
  const {balance} = useWallet();
  const [selectedAmount, setSelectedAmount] = useState(null);

  const getAmountOptions = () => {
    return [
      {
        amount: 5,
        title: '₹5',
        subtitle: 'Starter',
        prizePool: 5 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 10,
        title: '₹10',
        subtitle: 'Casual',
        prizePool: 10 * playerCount * 0.8,
        popular: true,
      },
      {
        amount: 15,
        title: '₹15',
        subtitle: 'Beginner',
        prizePool: 15 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 20,
        title: '₹20',
        subtitle: 'Regular',
        prizePool: 20 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 25,
        title: '₹25',
        subtitle: 'Competitive',
        prizePool: 25 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 50,
        title: '₹50',
        subtitle: 'Pro',
        prizePool: 50 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 100,
        title: '₹100',
        subtitle: 'Expert',
        prizePool: 100 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 250,
        title: '₹250',
        subtitle: 'Master',
        prizePool: 250 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 500,
        title: '₹500',
        subtitle: 'Elite',
        prizePool: 500 * playerCount * 0.8,
        popular: false,
      },
      {
        amount: 1000,
        title: '₹1000',
        subtitle: 'Champion',
        prizePool: 1000 * playerCount * 0.8,
        popular: false,
      },
    ];
  };

  const amountOptions = getAmountOptions();

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

  const handleBackPress = () => {
    navigation.navigate('PlayerSelection', {game});
  };

  return (
    <GradientBackground>
      <CommonHeader
        title={`${game.name} - ${playerCount} Players`}
        subtitle="Select entry amount"
        icon={game.emoji}
        onBackPress={handleBackPress}
      />
      
      <ScrollView 
        style={commonStyles.scrollContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}>
        
        {/* Wallet Balance */}
        <View style={[commonStyles.compactCard, styles.balanceCard]}>
          <View style={[commonStyles.row, commonStyles.spaceBetween]}>
            <View>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
            </View>
            <TouchableOpacity
              style={styles.addMoneyButton}
              onPress={() => navigation.navigate('Wallet')}>
              <Text style={styles.addMoneyText}>Add Money</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Amount Options */}
        <Text style={commonStyles.sectionTitle}>Choose Entry Amount</Text>
        
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

        {/* Game Details */}
        <Text style={commonStyles.sectionTitle}>Game Details</Text>
        <View style={commonStyles.card}>
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
            <Text style={styles.detailValue}>20%</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Winner Gets:</Text>
            <Text style={styles.detailValue}>80% of Prize Pool</Text>
          </View>
        </View>

        {/* Terms */}
        <View style={[commonStyles.card, styles.termsCard]}>
          <Text style={styles.termsTitle}>⚠️ Important Notes</Text>
          <Text style={styles.termsText}>
            • Entry fee will be deducted from your wallet immediately{'\n'}
            • Game will start once all players join{'\n'}
            • Winner gets 80% of the total prize pool{'\n'}
            • 20% platform fee applies to all games{'\n'}
            • Refund available if game doesn't start within 5 minutes
          </Text>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  balanceCard: {
    borderColor: theme.colors.success,
    borderWidth: 1,
  },
  balanceLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  balanceAmount: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  addMoneyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
  },
  addMoneyText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  optionCard: {
    width: (width - theme.spacing.lg * 2 - theme.spacing.sm) / 2,
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
    minHeight: 100,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.backgroundLight,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderTopRightRadius: theme.borderRadius.md,
    borderBottomLeftRadius: theme.borderRadius.sm,
  },
  popularText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionAmount: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  optionSubtitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  prizeInfo: {
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
  insufficientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: theme.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insufficientText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.xs,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  detailLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
  },
  detailValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  
  termsCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    marginBottom: theme.spacing.xl,
  },
  termsTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.warning,
    marginBottom: theme.spacing.sm,
  },
  termsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});

export default AmountSelectionScreen;