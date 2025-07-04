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
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';
import CommonHeader from '../components/CommonHeader';

const WalletScreen = ({navigation}) => {
  const {
    balance,
    transactions,
    fetchBalance,
    fetchTransactions,
    createDepositOrder,
    verifyDeposit,
    createWithdrawal,
    razorpayKey,
  } = useWallet();

  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [withdrawMethod, setWithdrawMethod] = useState('bank'); // bank, upi, crypto
  const [withdrawDetails, setWithdrawDetails] = useState({
    bank: { accountNumber: '', ifscCode: '', accountHolder: '' },
    upi: { upiId: '' },
    crypto: { walletAddress: '', cryptoType: 'USDT' }
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

    setLoading(true);
    try {
      // First create the order
      const result = await createDepositOrder(amountNum);
      
      if (result.success) {
        // Open Razorpay payment gateway
        const options = {
          description: 'Wallet Deposit',
          image: 'https://your-logo-url.com/logo.png', // Add your logo URL
          currency: 'INR',
          key: razorpayKey || 'rzp_live_C2grRiZzvpoi4i', // Use from context or fallback
          amount: amountNum * 100, // Amount in paise
          name: 'Budzee Gaming',
          order_id: result.order.id,
          prefill: {
            email: 'user@budzee.com',
            contact: '9999999999',
            name: 'User'
          },
          theme: {
            color: theme.colors.primary
          }
        };

        console.log('Opening Razorpay with options:', options);
        
        const paymentResult = await RazorpayCheckout.open(options);
        console.log('Payment success:', paymentResult);
        
        // Verify payment with backend
        const verifyResult = await verifyDeposit({
          razorpay_order_id: paymentResult.razorpay_order_id,
          razorpay_payment_id: paymentResult.razorpay_payment_id,
          razorpay_signature: paymentResult.razorpay_signature,
          amount: amountNum
        });
        
        if (verifyResult.success) {
          setShowAddMoneyModal(false);
          setAmount('');
          Alert.alert('Success', 'Money added successfully!');
          fetchBalance();
          fetchTransactions();
        } else {
          Alert.alert('Error', 'Payment verification failed');
        }
      } else {
        Alert.alert('Error', result.message || 'Failed to create deposit order');
      }
    } catch (error) {
      console.log('Payment error:', error);
      if (error.code === 'PAYMENT_CANCELLED') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment');
      } else {
        Alert.alert('Error', 'Payment failed. Please try again.');
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
    if (amountNum > balance) {
      Alert.alert('Error', 'Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const withdrawalDetails = {
        method: withdrawMethod,
        details: withdrawDetails[withdrawMethod]
      };
      const result = await createWithdrawal(amountNum, withdrawalDetails);
      
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

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit': return '💳';
      case 'withdrawal': return '🏦';
      case 'game_win': return '🏆';
      case 'game_loss': return '🎮';
      case 'refund': return '↩️';
      default: return '💰';
    }
  };

  const getTransactionColor = (type) => {
    switch (type) {
      case 'deposit':
      case 'game_win':
      case 'refund':
        return theme.colors.success;
      case 'withdrawal':
      case 'game_loss':
        return theme.colors.danger;
      default:
        return theme.colors.textSecondary;
    }
  };

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionItem}>
      <Text style={styles.transactionIcon}>
        {getTransactionIcon(item.type)}
      </Text>
      <View style={styles.transactionDetails}>
        <Text style={styles.transactionTitle} numberOfLines={1}>
          {item.description}
        </Text>
        <Text style={styles.transactionDate}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
      <Text style={[
        styles.transactionAmount,
        { color: getTransactionColor(item.type) }
      ]}>
        {item.type === 'withdrawal' || item.type === 'game_loss' ? '-' : '+'}
        ₹{Math.abs(item.amount).toFixed(0)}
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
                <Text style={styles.balanceLabel}>Available Balance</Text>
                <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
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
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Total Won</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>₹0</Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>0</Text>
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
              
              <Text style={styles.modalLabel}>Available: ₹{balance.toFixed(2)}</Text>
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
                
                <TouchableOpacity
                  style={[styles.methodButton, withdrawMethod === 'crypto' && styles.selectedMethod]}
                  onPress={() => setWithdrawMethod('crypto')}>
                  <Text style={styles.methodIcon}>₿</Text>
                  <Text style={[styles.methodText, withdrawMethod === 'crypto' && styles.selectedMethodText]}>Crypto</Text>
                </TouchableOpacity>
              </View>
              
              {/* Method-specific fields */}
              {withdrawMethod === 'bank' && (
                <View style={styles.detailsSection}>
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
              
              {withdrawMethod === 'crypto' && (
                <View style={styles.detailsSection}>
                  <View style={styles.cryptoTypeSelector}>
                    <TouchableOpacity
                      style={[styles.cryptoButton, withdrawDetails.crypto.cryptoType === 'USDT' && styles.selectedCrypto]}
                      onPress={() => setWithdrawDetails(prev => ({
                        ...prev,
                        crypto: { ...prev.crypto, cryptoType: 'USDT' }
                      }))}>
                      <Text style={styles.cryptoButtonText}>USDT</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cryptoButton, withdrawDetails.crypto.cryptoType === 'BTC' && styles.selectedCrypto]}
                      onPress={() => setWithdrawDetails(prev => ({
                        ...prev,
                        crypto: { ...prev.crypto, cryptoType: 'BTC' }
                      }))}>
                      <Text style={styles.cryptoButtonText}>BTC</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.cryptoButton, withdrawDetails.crypto.cryptoType === 'ETH' && styles.selectedCrypto]}
                      onPress={() => setWithdrawDetails(prev => ({
                        ...prev,
                        crypto: { ...prev.crypto, cryptoType: 'ETH' }
                      }))}>
                      <Text style={styles.cryptoButtonText}>ETH</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.modalInput}
                    placeholder={`${withdrawDetails.crypto.cryptoType} Wallet Address`}
                    placeholderTextColor={theme.colors.textTertiary}
                    value={withdrawDetails.crypto.walletAddress}
                    onChangeText={(text) => setWithdrawDetails(prev => ({
                      ...prev,
                      crypto: { ...prev.crypto, walletAddress: text }
                    }))}
                    editable={!loading}
                  />
                </View>
              )}
              
              <Text style={styles.withdrawNote}>
                • Min withdrawal: ₹100 • Processing: 1-3 days • No charges
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
  actionButtons: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  actionButton: {
    flex: 1,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
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
  cryptoTypeSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  cryptoButton: {
    flex: 1,
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  selectedCrypto: {
    backgroundColor: theme.colors.accent,
    borderColor: theme.colors.accent,
  },
  cryptoButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
});

export default WalletScreen;