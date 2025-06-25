import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
  SafeAreaView,
} from 'react-native';
import { useWallet } from '../context/WalletContext';

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Wallet</Text>
        <View style={{ width: 60 }} />
      </View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Wallet Balance</Text>
        <Text style={styles.balanceAmount}>₹{balance.toFixed(2)}</Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowDeposit(true)}>
            <Text style={styles.actionBtnText}>Add Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => setShowWithdraw(true)}>
            <Text style={styles.actionBtnText}>Withdraw</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Transactions</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#3498db" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          refreshing={refreshing}
          onRefresh={onRefresh}
          renderItem={({ item }) => (
            <View style={styles.txnItem}>
              <Text style={styles.txnType}>{item.type}</Text>
              <Text style={styles.txnAmount}>₹{item.amount}</Text>
              <Text style={styles.txnStatus}>{item.status}</Text>
              <Text style={styles.txnDate}>{new Date(item.createdAt).toLocaleString()}</Text>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>No transactions yet.</Text>}
        />
      )}
      {/* Deposit Modal */}
      <Modal visible={showDeposit} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Money</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (min ₹10)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleDeposit}>
              <Text style={styles.modalBtnText}>Proceed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowDeposit(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Withdraw Modal */}
      <Modal visible={showWithdraw} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Withdraw</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter amount (min ₹100)"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={styles.input}
              placeholder="Account Number"
              value={bankDetails.accountNumber}
              onChangeText={text => setBankDetails({ ...bankDetails, accountNumber: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="IFSC Code"
              value={bankDetails.ifscCode}
              onChangeText={text => setBankDetails({ ...bankDetails, ifscCode: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Account Holder Name"
              value={bankDetails.accountHolderName}
              onChangeText={text => setBankDetails({ ...bankDetails, accountHolderName: text })}
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleWithdraw}>
              <Text style={styles.modalBtnText}>Proceed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowWithdraw(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  backText: { fontSize: 16, color: '#3498db', fontWeight: '600' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50' },
  balanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  balanceLabel: { fontSize: 14, color: '#7f8c8d', marginBottom: 4 },
  balanceAmount: { fontSize: 28, fontWeight: 'bold', color: '#27ae60', marginBottom: 12 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', width: '100%' },
  actionBtn: {
    backgroundColor: '#3498db',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 8,
    marginTop: 8,
  },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#2c3e50', marginLeft: 20, marginTop: 10 },
  txnItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  txnType: { fontWeight: 'bold', color: '#2c3e50' },
  txnAmount: { color: '#27ae60', fontWeight: 'bold', fontSize: 16 },
  txnStatus: { color: '#7f8c8d', fontSize: 12 },
  txnDate: { color: '#95a5a6', fontSize: 12 },
  emptyText: { textAlign: 'center', color: '#7f8c8d', marginTop: 20 },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '85%',
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#2c3e50', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    width: '100%',
    backgroundColor: '#f8f9fa',
  },
  modalBtn: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  modalBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  modalCancel: { alignItems: 'center', width: '100%' },
  modalCancelText: { color: '#e74c3c', fontSize: 14, fontWeight: '600' },
});

export default WalletScreen;
