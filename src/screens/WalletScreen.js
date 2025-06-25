import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { useWallet } from '../context/WalletContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const WalletScreen = ({ navigation }) => {
  const {
    balance,
    fetchBalance,
    fetchTransactions,
    transactions,
    createDepositOrder,
    verifyDeposit,
    createWithdrawal,
    razorpayKey,
    loading,
  } = useWallet();

  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifscCode: '',
    accountHolderName: '',
  });
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const handleDeposit = async () => {
    if (!amount || isNaN(amount) || Number(amount) < 10) {
      Alert.alert('Error', 'Enter a valid amount (min ₹10)');
      return;
    }
    const order = await createDepositOrder(Number(amount));
    if (order.success && razorpayKey) {
      // Integrate Razorpay here in real app
      Alert.alert('Demo', 'Razorpay payment would be initiated here.');
      // On success, call verifyDeposit
      // await verifyDeposit({ ... });
      setShowDeposit(false);
      setAmount('');
      fetchBalance();
      fetchTransactions();
    } else {
      Alert.alert('Error', order.message || 'Failed to create order');
    }
  };

  const handleWithdraw = async () => {
    if (!amount || isNaN(amount) || Number(amount) < 100) {
      Alert.alert('Error', 'Enter a valid amount (min ₹100)');
      return;
    }
    if (!bankDetails.accountNumber || !bankDetails.ifscCode || !bankDetails.accountHolderName) {
      Alert.alert('Error', 'Please fill all bank details');
      return;
    }
    const result = await createWithdrawal(Number(amount), bankDetails);
    if (result.success) {
      Alert.alert('Success', 'Withdrawal request created!');
      setShowWithdraw(false);
      setAmount('');
      setBankDetails({ accountNumber: '', ifscCode: '', accountHolderName: '' });
      fetchBalance();
      fetchTransactions();
    } else {
      Alert.alert('Error', result.message || 'Failed to withdraw');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBalance();
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleBackPress = () => {
    navigation.navigate('Home');
  };

  return (
    <GradientBackground>
      <CommonHeader
        title="Gaming Wallet"
        icon="💰"
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
        }
      >
        {/* Balance Card */}
        <View style={[commonStyles.card, styles.balanceCard]}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceIcon}>💎</Text>
            <Text style={styles.balanceLabel}>Your Gaming Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
          
          {/* Quick Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[commonStyles.button, styles.depositBtn]} 
              onPress={() => setShowDeposit(true)}
            >
              <Text style={styles.actionIcon}>💳</Text>
              <Text style={commonStyles.buttonText}>Add Money</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[commonStyles.button, styles.withdrawBtn]} 
              onPress={() => setShowWithdraw(true)}
            >
              <Text style={styles.actionIcon}>🏦</Text>
              <Text style={commonStyles.buttonText}>Withdraw</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🎮</Text>
            <Text style={styles.statValue}>{transactions.filter(t => t.type === 'GAME_ENTRY').length}</Text>
            <Text style={styles.statLabel}>Games Played</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>₹{transactions.filter(t => t.type === 'GAME_WINNING').reduce((sum, t) => sum + parseFloat(t.amount || 0), 0).toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Winnings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>📈</Text>
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>

        {/* Transactions Section */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>🕒 Recent Transactions</Text>
          
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactions.length > 0 ? (
            <View style={styles.transactionsList}>
              {transactions.slice(0, 10).map((item, index) => (
                <View key={item.id || index} style={styles.txnItem}>
                  <View style={styles.txnLeft}>
                    <Text style={styles.txnIcon}>
                      {item.type === 'DEPOSIT' ? '💳' : 
                       item.type === 'WITHDRAWAL' ? '🏦' : 
                       item.type === 'GAME_ENTRY' ? '🎮' : 
                       item.type === 'GAME_WINNING' ? '🏆' : '💰'}
                    </Text>
                    <View style={styles.txnDetails}>
                      <Text style={styles.txnType}>
                        {item.type === 'DEPOSIT' ? 'Money Added' : 
                         item.type === 'WITHDRAWAL' ? 'Money Withdrawn' : 
                         item.type === 'GAME_ENTRY' ? 'Game Entry Fee' : 
                         item.type === 'GAME_WINNING' ? 'Game Winning' : item.type}
                      </Text>
                      <Text style={styles.txnDate}>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.txnRight}>
                    <Text style={[
                      styles.txnAmount,
                      item.type === 'DEPOSIT' || item.type === 'GAME_WINNING' ? styles.txnAmountPositive : styles.txnAmountNegative
                    ]}>
                      {item.type === 'DEPOSIT' || item.type === 'GAME_WINNING' ? '+' : '-'}₹{parseFloat(item.amount || 0).toFixed(2)}
                    </Text>
                    <Text style={[
                      styles.txnStatus,
                      item.status === 'COMPLETED' ? styles.statusCompleted : 
                      item.status === 'PENDING' ? styles.statusPending : styles.statusFailed
                    ]}>
                      {item.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎮</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Start playing games to see your transaction history!</Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      {/* Gaming Deposit Modal */}
      <Modal visible={showDeposit} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalIcon}>💳</Text>
              <Text style={styles.modalTitle}>Add Money to Wallet</Text>
              <Text style={styles.modalSubtitle}>Minimum amount: ₹10</Text>
            </View>
            
            <View style={styles.modalForm}>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter amount (min ₹10)"
                placeholderTextColor={theme.colors.textLight}
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              
              <View style={styles.quickAmounts}>
                {[100, 500, 1000, 2000].map(amt => (
                  <TouchableOpacity 
                    key={amt}
                    style={styles.quickAmountBtn}
                    onPress={() => setAmount(amt.toString())}
                  >
                    <Text style={styles.quickAmountText}>₹{amt}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalBtn} onPress={handleDeposit}>
                <Text style={styles.modalBtnText}>🚀 Proceed to Payment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeposit(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Gaming Withdraw Modal */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalScrollContent}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalIcon}>🏦</Text>
                <Text style={styles.modalTitle}>Withdraw Money</Text>
                <Text style={styles.modalSubtitle}>Minimum amount: ₹100</Text>
              </View>
              
              <View style={styles.modalForm}>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter amount (min ₹100)"
                  placeholderTextColor={theme.colors.textLight}
                  keyboardType="numeric"
                  value={amount}
                  onChangeText={setAmount}
                />
                
                <Text style={styles.formSectionTitle}>🏦 Bank Details</Text>
                
                <TextInput
                  style={styles.modalInput}
                  placeholder="Account Number"
                  placeholderTextColor={theme.colors.textLight}
                  value={bankDetails.accountNumber}
                  onChangeText={text => setBankDetails({ ...bankDetails, accountNumber: text })}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="IFSC Code"
                  placeholderTextColor={theme.colors.textLight}
                  value={bankDetails.ifscCode}
                  onChangeText={text => setBankDetails({ ...bankDetails, ifscCode: text })}
                />
                <TextInput
                  style={styles.modalInput}
                  placeholder="Account Holder Name"
                  placeholderTextColor={theme.colors.textLight}
                  value={bankDetails.accountHolderName}
                  onChangeText={text => setBankDetails({ ...bankDetails, accountHolderName: text })}
                />
              </View>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtn} onPress={handleWithdraw}>
                  <Text style={styles.modalBtnText}>💸 Request Withdrawal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWithdraw(false)}>
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  balanceCard: {
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  balanceHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  balanceIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.sm,
  },
  balanceLabel: { 
    fontSize: theme.fonts.sizes.md, 
    color: theme.colors.textLight, 
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  balanceAmount: { 
    fontSize: 36, 
    fontWeight: 'bold', 
    color: theme.colors.primary, 
    marginBottom: theme.spacing.lg,
    textShadowColor: 'rgba(255, 107, 53, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  actionRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    width: '100%',
    gap: theme.spacing.md,
  },
  actionBtn: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  depositBtn: {
    backgroundColor: theme.colors.success,
  },
  withdrawBtn: {
    backgroundColor: theme.colors.secondary,
  },
  actionIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  actionBtnText: { 
    color: theme.colors.textPrimary, 
    fontSize: theme.fonts.sizes.sm, 
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  statCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: theme.spacing.xs,
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(78, 205, 196, 0.2)',
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
    fontWeight: '500',
  },
  transactionsSection: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
  },
  sectionTitle: { 
    fontSize: theme.fonts.sizes.lg, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  loadingText: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  transactionsList: {
    gap: theme.spacing.sm,
  },
  txnItem: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...theme.shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  txnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  txnIcon: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  txnDetails: {
    flex: 1,
  },
  txnType: { 
    fontWeight: 'bold', 
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.md,
  },
  txnDate: { 
    color: theme.colors.textLight, 
    fontSize: theme.fonts.sizes.sm,
    marginTop: theme.spacing.xs,
  },
  txnRight: {
    alignItems: 'flex-end',
  },
  txnAmount: { 
    fontWeight: 'bold', 
    fontSize: theme.fonts.sizes.md,
  },
  txnAmountPositive: {
    color: theme.colors.success,
  },
  txnAmountNegative: {
    color: theme.colors.danger,
  },
  txnStatus: { 
    fontSize: theme.fonts.sizes.xs,
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  statusCompleted: {
    color: theme.colors.success,
  },
  statusPending: {
    color: theme.colors.warning,
  },
  statusFailed: {
    color: theme.colors.danger,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xxl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.md,
  },
  emptyText: { 
    textAlign: 'center', 
    color: theme.colors.textSecondary, 
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    textAlign: 'center', 
    color: theme.colors.textLight, 
    fontSize: theme.fonts.sizes.md,
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.large,
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.sm,
  },
  modalTitle: { 
    fontSize: theme.fonts.sizes.xl, 
    fontWeight: 'bold', 
    color: theme.colors.primary, 
    marginBottom: theme.spacing.xs,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textLight,
    textAlign: 'center',
  },
  modalForm: {
    marginBottom: theme.spacing.lg,
  },
  modalInput: {
    ...commonStyles.input,
    marginBottom: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    ...theme.shadows.small,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  quickAmountBtn: {
    backgroundColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    flex: 1,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  quickAmountText: {
    color: theme.colors.textDark,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: 'bold',
  },
  formSectionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  modalActions: {
    gap: theme.spacing.md,
  },
  modalBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  modalBtnText: { 
    color: theme.colors.textPrimary, 
    fontSize: theme.fonts.sizes.md, 
    fontWeight: 'bold',
  },
  modalCancel: { 
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  modalCancelText: { 
    color: theme.colors.danger, 
    fontSize: theme.fonts.sizes.md, 
    fontWeight: '600',
  },
});

export default WalletScreen;
