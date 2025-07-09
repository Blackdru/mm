import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import {useWallet} from '../context/WalletContext';
import {useAuth} from '../context/AuthContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const WalletScreen = ({navigation}) => {
  const {
    balance,
    gameBalance,
    withdrawableBalance,
    transactions,
    fetchBalance,
    fetchTransactions,
    createDepositOrder,
    verifyDeposit,
    createWithdrawal,
    razorpayKey,
  } = useWallet();

  const { user } = useAuth();

  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // bank, upi
  const [withdrawDetails, setWithdrawDetails] = useState({
    bank: { accountNumber: '', ifscCode: '', accountHolder: '', fullName: '' },
    upi: { upiId: '', fullName: '' }
  });

  useEffect(() => {
    fetchBalance();
    fetchTransactions();
  }, []);

  const quickAmounts = [100, 500, 1000, 2000];

  const handleAddMoney = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 10) {
      Alert.alert('Error', 'Minimum amount is ₹10');
      return;
    }
    if (amountNum > 50000) {
      Alert.alert('Error', 'Maximum amount is ₹50,000');
      return;
    }

    if (!razorpayKey) {
      Alert.alert('Error', 'Payment gateway not configured. Please try again later.');
      return;
    }

    setLoading(true);
    try {
      console.log('Starting deposit process for amount:', amountNum);
      
      // First create the order
      const result = await createDepositOrder(amountNum);
      console.log('Create deposit order result:', result);
      
      if (result.success && result.order) {
        // Prepare user details for prefill with fallbacks
        const userEmail = user?.email || 'user@budzee.com';
        const userContact = user?.phoneNumber || '9999999999';
        const userName = user?.name || 'User';

        console.log('User details for prefill:', {
          email: userEmail,
          contact: userContact,
          name: userName,
          userObject: user
        });

        // Open Razorpay payment gateway
        const options = {
          description: 'Wallet Deposit',
          image: 'https://your-logo-url.com/logo.png', // Add your logo URL
          currency: 'INR',
          key: razorpayKey, // Always use the key from backend
          amount: amountNum * 100, // Amount in paise
          name: 'Budzee Gaming',
          order_id: result.order.id,
          prefill: {
            email: userEmail,
            contact: userContact,
            name: userName
          },
          theme: {
            color: theme.colors.primary
          }
        };

        console.log('Opening Razorpay with options:', {
          ...options,
          key: razorpayKey ? 'SET' : 'NOT_SET'
        });
        
        const paymentResult = await RazorpayCheckout.open(options);
        console.log('Payment success:', paymentResult);
        
        // Verify payment with backend
        const verifyResult = await verifyDeposit({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          amount: amountNum
        });
        
        console.log('Verify deposit result:', verifyResult);
        
        if (verifyResult.success) {
          setShowAddMoneyModal(false);
          setAmount('');
          Alert.alert('Success', 'Money added successfully!');
          fetchBalance();
          fetchTransactions();
        } else {
          Alert.alert('Error', verifyResult.message || 'Payment verification failed');
        }
      } else {
        console.error('Failed to create deposit order:', result);
        Alert.alert('Error', result.message || 'Failed to create deposit order. Please try again.');
      }
    } catch (error) {
      console.error('Payment error:', error);
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment');
      } else if (error.message && error.message.includes('network')) {
        Alert.alert('Network Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Error', error.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum < 100) {
      Alert.alert('Error', 'Minimum withdrawal amount is ₹100');
      return;
    }
    if (amountNum > withdrawableBalance) {
      Alert.alert('Error', `Insufficient withdrawable balance. You can only withdraw winnings (₹${(withdrawableBalance || 0).toFixed(2)} available). Referral bonuses and deposits can only be used for playing games.`);
      return;
    }

    setLoading(true);
    try {
      const details = withdrawDetails[withdrawMethod];
      const withdrawalDetailsData = {
        method: withdrawMethod,
        details: details,
      };
      const result = await createWithdrawal(amountNum, withdrawalDetailsData);
      
      if (result.success) {
        setShowWithdrawModal(false);
        setAmount('');
        Alert.alert('Success', 'Withdrawal request submitted!');
        fetchBalance();
        fetchTransactions();
      } else {
        Alert.alert('Error', result.message || 'Failed to process withdrawal');
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionIcon = (type, status) => {
    if (status === 'FAILED') return '❌';
    if (status === 'PENDING') return '⏳';
    
    switch (type) {
      case 'DEPOSIT': return '💳';
      case 'WITHDRAWAL': return '🏦';
      case 'GAME_WINNING': return '🏆';
      case 'GAME_ENTRY': return '🎮';
      case 'REFUND': return '↩️';
      default: return '💰';
    }
  };

  const getTransactionColor = (type, status) => {
    if (status === 'FAILED') return theme.colors.danger;
    if (status === 'PENDING') return theme.colors.warning;
    
    switch (type) {
      case 'DEPOSIT':
      case 'GAME_WINNING':
      case 'REFUND':
        return theme.colors.success;
      case 'WITHDRAWAL':
      case 'GAME_ENTRY':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getGameName = (gameId) => {
    if (!gameId) return '';
    return 'Memory Game'; // Default game name
  };

  const calculateTotalWon = () => {
    if (!Array.isArray(transactions)) return '0';
    return transactions
      .filter(t => ['GAME_WINNING', 'REFUND'].includes(t.type) && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
      .toFixed(0);
  };

  const calculateTotalSpent = () => {
    if (!Array.isArray(transactions)) return '0';
    return transactions
      .filter(t => t.type === 'GAME_ENTRY' && t.status === 'COMPLETED')
      .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
      .toFixed(0);
  };

  const calculateGamesPlayed = () => {
    if (!Array.isArray(transactions)) return 0;
    return transactions
      .filter(t => t.type === 'GAME_ENTRY' && t.status === 'COMPLETED')
      .length;
  };

  const renderTransaction = ({ item }) => (
    <View style={[
      styles.transactionItem,
      item.status === 'PENDING' && styles.pendingTransaction,
      item.status === 'FAILED' && styles.failedTransaction
    ]}>
      <Text style={styles.transactionIcon}>
        {getTransactionIcon(item.type, item.status)}
      </Text>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {item.gameId ? `${getGameName(item.gameId)} - ${item.description}` : item.description}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.createdAt)} • {item.status || 'COMPLETED'}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: getTransactionColor(item.type, item.status) }
      ]}>
        {['WITHDRAWAL', 'GAME_ENTRY'].includes(item.type) ? '-' : '+'}
        ₹{Math.abs(item.amount).toFixed(2)}
      </Text>
    </View>
  );

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <CommonHeader
          title="Gaming Wallet"
          subtitle="Manage your funds"
          icon="💰"
          onBackPress={() => navigation.navigate('Home')}
        />

        {/* Balance Card */}
        <View style={styles.balanceSection}>
          <View style={[commonStyles.attractiveCard, styles.balanceCard]}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconContainer}>
                <Text style={styles.balanceIcon}>💎</Text>
              </View>
              <View style={styles.balanceInfo}>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>₹{(Number(balance) || 0).toFixed(2)}</Text>
              </View>
            </View>
            
            {/* Enhanced Balance Breakdown */}
            <View style={styles.balanceDetailsSection}>
              <View style={styles.balanceDetailCard}>
                <View style={styles.balanceDetailHeader}>
                  <Text style={styles.balanceDetailIcon}>🎮</Text>
                  <Text style={styles.balanceDetailTitle}>Game Balance</Text>
                </View>
                <Text style={styles.balanceDetailAmount}>₹{(Number(gameBalance) || 0).toFixed(2)}</Text>
                <Text style={styles.balanceDetailDescription}>
                  Money for playing games (deposits + referral bonuses)
                </Text>
              </View>
              
              <View style={styles.balanceDetailCard}>
                <View style={styles.balanceDetailHeader}>
                  <Text style={styles.balanceDetailIcon}>💰</Text>
                  <Text style={styles.balanceDetailTitle}>Withdraw Balance</Text>
                </View>
                <Text style={[styles.balanceDetailAmount, styles.withdrawableAmount]}>₹{(Number(withdrawableBalance) || 0).toFixed(2)}</Text>
                <Text style={styles.balanceDetailDescription}>
                  Winnings that can be withdrawn to your bank account
                </Text>
              </View>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, styles.addButton]}
                onPress={() => setShowAddMoneyModal(true)}>
                <Text style={styles.actionButtonText}>💳 Add Money</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.withdrawButton]}
                onPress={() => setShowWithdrawModal(true)}>
                <Text style={styles.actionButtonText}>🏦 Withdraw</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{calculateTotalWon()}</Text>
              <Text style={styles.statLabel}>Total Won</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹{calculateTotalSpent()}</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{calculateGamesPlayed()}</Text>
              <Text style={styles.statLabel}>Games</Text>
            </View>
          </View>
        </View>

        {/* Transactions */}
        <View style={styles.transactionsSection}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📝</Text>
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Add money to start playing
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions} // Show all transactions
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={true}
              style={styles.transactionsList}
              contentContainerStyle={styles.transactionsContent}
              nestedScrollEnabled={true}
            />
          )}
        </View>

        {/* Add Money Modal */}
        <Modal
          visible={showAddMoneyModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowAddMoneyModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>💳 Add Money</Text>
              
              <TextInput
                style={styles.modalInput}
                placeholder="Enter amount (₹10 - ₹50,000)"
                placeholderTextColor={theme.colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!loading}
              />
              
              <View style={styles.quickAmounts}>
                {quickAmounts.map((quickAmount) => (
                  <TouchableOpacity
                    key={quickAmount}
                    style={styles.quickAmountButton}
                    onPress={() => setAmount(quickAmount.toString())}>
                    <Text style={styles.quickAmountText}>₹{quickAmount}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowAddMoneyModal(false)}
                  disabled={loading}>
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleAddMoney}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Add Money</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Withdraw Modal */}
        <Modal
          visible={showWithdrawModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowWithdrawModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalTitle}>💰 Withdraw Money</Text>
              
              <Text style={styles.modalLabel}>Withdrawable: ₹{(withdrawableBalance || 0).toFixed(2)}</Text>
              <Text style={styles.modalNote}>Only winnings can be withdrawn. Game balance (deposits + referral bonuses) can only be used for playing.</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter amount (Min ₹100)"
                placeholderTextColor={theme.colors.textTertiary}
                value={amount}
                onChangeText={setAmount}
                keyboardType="numeric"
                editable={!loading}
              />
              
              {/* Withdrawal Method Selection */}
              <Text style={styles.sectionLabel}>Select Withdrawal Method:</Text>
              <View style={styles.methodSelector}>
                <TouchableOpacity
                  style={[styles.methodButton, withdrawMethod === 'bank' && styles.selectedMethod]}
                  onPress={() => setWithdrawMethod('bank')}>
                  <Text style={styles.methodIcon}>🏦</Text>
                  <Text style={[styles.methodText, withdrawMethod === 'bank' && styles.selectedMethodText]}>Bank</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.methodButton, withdrawMethod === 'upi' && styles.selectedMethod]}
                  onPress={() => setWithdrawMethod('upi')}>
                  <Text style={styles.methodIcon}>📱</Text>
                  <Text style={[styles.methodText, withdrawMethod === 'upi' && styles.selectedMethodText]}>UPI</Text>
                </TouchableOpacity>
              </View>
              
              {/* Method-specific fields */}
              {withdrawMethod === 'bank' && (
                <View style={styles.detailsSection}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Full Name (as per bank records)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.bank.fullName}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      bank: { ...prev.bank, fullName: text }
                    }))}
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Account Holder Name"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.bank.accountHolder}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      bank: { ...prev.bank, accountHolder: text }
                    }))}
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Account Number"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.bank.accountNumber}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      bank: { ...prev.bank, accountNumber: text }
                    }))}
                    keyboardType="numeric"
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="IFSC Code"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.bank.ifscCode}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      bank: { ...prev.bank, ifscCode: text.toUpperCase() }
                    }))}
                    editable={!loading}
                  />
                </View>
              )}
              
              {withdrawMethod === 'upi' && (
                <View style={styles.detailsSection}>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="Full Name (as per UPI account)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.upi.fullName}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      upi: { ...prev.upi, fullName: text }
                    }))}
                    editable={!loading}
                  />
                  <TextInput
                    style={styles.modalInput}
                    placeholder="UPI ID (e.g., user@paytm)"
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.upi.upiId}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      upi: { ...prev.upi, upiId: text }
                    }))}
                    editable={!loading}
                  />
                </View>
              )}
              
              <Text style={styles.withdrawNote}>
                • Min withdrawal: ₹100 • Processing: 1-2 days • No charges
              </Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelModalButton]}
                  onPress={() => setShowWithdrawModal(false)}
                  disabled={loading}>
                  <Text style={styles.cancelModalButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.modalButton, styles.confirmButton]}
                  onPress={handleWithdraw}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color={theme.colors.textPrimary} size="small" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Withdraw</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  balanceSection: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  balanceCard: {
    borderColor: theme.colors.success,
    borderWidth: 2,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  balanceIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.md,
    ...theme.shadows.successShadow,
  },
  balanceIcon: {
    fontSize: 24,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.textSuccess,
    marginTop: 2,
  },
  balanceBreakdown: {
    marginTop: theme.spacing.xs,
  },
  balanceSubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
     marginTop: 10,
    ...theme.shadows.small,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
  },
  withdrawButton: {
    backgroundColor: theme.colors.warning,
  },
  actionButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
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
  statLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  
  transactionsSection: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  transactionsList: {
    flex: 1,
    maxHeight: 400, // Increased height to display more transactions
  },
  transactionsContent: {
    paddingBottom: theme.spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pendingTransaction: {
    borderColor: theme.colors.warning,
    backgroundColor: 'rgba(243, 156, 18, 0.1)',
  },
  failedTransaction: {
    borderColor: theme.colors.danger,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  transactionDate: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
  },
  
  emptyState: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: theme.spacing.md,
  },
  emptyText: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  emptySubtext: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    width: '100%',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  modalLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  modalNote: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.warning,
    marginBottom: theme.spacing.md,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalInput: {
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.lg,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  quickAmountButton: {
    backgroundColor: theme.colors.backgroundInput,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickAmountText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
  },
  withdrawNote: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    lineHeight: 18,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: theme.colors.backgroundInput,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
  },
  cancelModalButtonText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  confirmButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  
  // Withdrawal method styles
  sectionLabel: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  methodSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  methodButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedMethod: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  methodIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.xs,
  },
  methodText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  selectedMethodText: {
    color: theme.colors.textPrimary,
  },
  detailsSection: {
    marginBottom: theme.spacing.md,
  },
    
  // Enhanced Balance Details Styles
  balanceDetailsSection: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.lg,
  },
  balanceDetailCard: {
    flex: 1,
    backgroundColor: theme.colors.backgroundLight,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  balanceDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  balanceDetailIcon: {
    fontSize: 16,
    marginRight: theme.spacing.sm,
  },
  balanceDetailTitle: {
    fontSize: theme.fonts.sizes.sm,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  balanceDetailAmount: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  withdrawableAmount: {
    color: theme.colors.success,
  },
  balanceDetailDescription: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    lineHeight: 14,
  },
});

export default WalletScreen;