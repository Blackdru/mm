import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {useWallet} from '../context/WalletContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

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

  const handleBackPress = () => {
    navigation.navigate('PlayerSelection', {game});
  };

  return (
    <GradientBackground>
      <CommonHeader
        title={`${game.name} - ${playerCount} Players`}
        subtitle="Select entry amount"
        icon={game.image}
        onBackPress={handleBackPress}
      />
      
      <ScrollView style={commonStyles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Wallet Balance */}
        <View style={[commonStyles.card, styles.balanceCard]}>
          <Text style={styles.balanceLabel}>Your Wallet Balance</Text>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          <TouchableOpacity
            style={[commonStyles.button, styles.addMoneyButton]}
            onPress={() => navigation.navigate('Wallet')}>
            <Text style={commonStyles.buttonText}>+ Add Money</Text>
          </TouchableOpacity>
        </View>

        {/* Amount Options */}
        <View style={styles.section}>
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
        </View>

        {/* Game Details */}
        <View style={styles.section}>
          <Text style={commonStyles.sectionTitle}>Game Details</Text>
          <View style={commonStyles.card}>
            <View style={[commonStyles.row, commonStyles.spaceBetween, styles.detailRow]}>
              <Text style={styles.detailLabel}>Game:</Text>
              <Text style={styles.detailValue}>{game.name}</Text>
            </View>
            <View style={[commonStyles.row, commonStyles.spaceBetween, styles.detailRow]}>
              <Text style={styles.detailLabel}>Players:</Text>
              <Text style={styles.detailValue}>{playerCount}</Text>
            </View>
            <View style={[commonStyles.row, commonStyles.spaceBetween, styles.detailRow]}>
              <Text style={styles.detailLabel}>Platform Fee:</Text>
              <Text style={styles.detailValue}>10%</Text>
            </View>
            <View style={[commonStyles.row, commonStyles.spaceBetween]}>
              <Text style={styles.detailLabel}>Winner Gets:</Text>
              <Text style={styles.detailValue}>90% of Prize Pool</Text>
            </View>
          </View>
        </View>

        {/* Terms */}
        <View style={styles.section}>
          <View style={[commonStyles.card, styles.termsCard]}>
            <Text style={styles.termsTitle}>⚠️ Important Notes</Text>
            <Text style={styles.termsText}>
              • Entry fee will be deducted from your wallet immediately{'\n'}
              • Game will start once all players join{'\n'}
              • Winner gets 90% of the total prize pool{'\n'}
              • 10% platform fee applies to all games{'\n'}
              • Refund available if game doesn't start within 5 minutes
            </Text>
          </View>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(46, 204, 113, 0.3)',
  },
  balanceLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.success,
    marginBottom: theme.spacing.sm,
  },
  addMoneyButton: {
    backgroundColor: theme.colors.info,
  },
  section: {
    marginBottom: theme.spacing.sm,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  optionCard: {
    width: '48%',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.sm,
    alignItems: 'center',
    ...theme.shadows.small,
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    minHeight: 100,
  },
  optionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surfaceCard,
    ...theme.shadows.medium,
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  popularBadge: {
    position: 'absolute',
    top: -6,
    backgroundColor: theme.colors.danger,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  popularText: {
    color: theme.colors.textPrimary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  optionAmount: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  optionSubtitle: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    marginBottom: theme.spacing.xs,
  },
  prizeInfo: {
    alignItems: 'center',
  },
  prizeLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textLight,
    marginBottom: 2,
  },
  prizeAmount: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
    color: theme.colors.success,
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
    fontWeight: 'bold',
    textAlign: 'center',
  },
  detailRow: {
    marginBottom: theme.spacing.xs,
  },
  detailLabel: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    fontWeight: 'bold',
  },
  termsCard: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.warning,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  termsTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.warning,
    marginBottom: theme.spacing.xs,
  },
  termsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textDark,
    lineHeight: 18,
    fontWeight: '500',
  },
});

export default AmountSelectionScreen;