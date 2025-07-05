import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  AppState,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import config from '../config/config';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';

const PaymentScreen = ({navigation, route}) => {
  const {playerCount} = route.params;
  const [loading, setLoading] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const [paymentInProgress, setPaymentInProgress] = useState(false);
  const { user, token } = useAuth();
  const { addTransaction } = useWallet();
  
  const amount = config.PAYMENT_CONFIG?.ENTRY_FEES?.[playerCount] || 10;

  // Handle app state changes to detect when user returns from payment gateway
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App has come to the foreground after payment');
        if (paymentInProgress) {
          // Give some time for payment callback to process
          setTimeout(() => {
            if (paymentInProgress) {
              setPaymentInProgress(false);
              setLoading(false);
              Alert.alert(
                'Payment Status Unknown',
                'Please check your wallet for payment status or contact support.',
                [
                  { text: 'Check Wallet', onPress: () => navigation.navigate('Wallet') },
                  { text: 'Try Again', onPress: () => {} }
                ]
              );
            }
          }, 3000);
        }
      }
      setAppState(nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [appState, paymentInProgress]);

  const handlePayment = async () => {
    if (!user || !token) {
      Alert.alert('Error', 'Please login to continue');
      return;
    }

    setLoading(true);
    setPaymentInProgress(true);
    
    try {
      // Create order from backend
      const response = await fetch(`${config.API_BASE_URL}/payments/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          playerCount: playerCount,
          gameType: 'memory',
          userId: user.id,
        }),
      });

      const orderData = await response.json();
      
      if (!orderData.success) {
        throw new Error(orderData.message || 'Failed to create order');
      }

      const options = {
        description: `Memory Game - ${playerCount} Players`,
        currency: 'INR',
        key: orderData.razorpayKeyId,
        amount: amount * 100, // Amount in paise
        name: 'Budzee Gaming',
        order_id: orderData.orderId,
        prefill: {
          email: user.email || 'player@budzee.com',
          contact: user.phoneNumber || '9999999999',
          name: user.name || 'Player'
        },
        theme: {
          color: '#FF6B35'
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal dismissed');
            setPaymentInProgress(false);
            setLoading(false);
          }
        },
        notes: {
          userId: user.id,
          gameType: 'memory',
          playerCount: playerCount
        }
      };

      console.log('Opening Razorpay checkout...');
      
      const data = await RazorpayCheckout.open(options);
      console.log('Payment Success:', data);
      
      setPaymentInProgress(false);
      
      // Verify payment with backend
      const verifyResponse = await fetch(`${config.API_BASE_URL}/payments/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          userId: user.id,
          amount: amount,
          gameType: 'memory',
          playerCount: playerCount,
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        // Add transaction to wallet context
        await addTransaction({
          type: 'deposit',
          amount: amount,
          description: `Game Entry Fee - ${playerCount} Players`,
          paymentId: data.razorpay_payment_id,
          status: 'completed'
        });
        
        setLoading(false);
        Alert.alert(
          'Payment Successful!',
          `₹${amount} has been added to your wallet.`,
          [
            { text: 'Continue to Game', onPress: () => navigation.navigate('Matchmaking', {playerCount, paymentConfirmed: true}) }
          ]
        );
      } else {
        throw new Error(verifyData.message || 'Payment verification failed');
      }
      
    } catch (error) {
      setPaymentInProgress(false);
      setLoading(false);
      
      if (error.code === 'payment_cancelled') {
        Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
      } else {
        Alert.alert('Payment Failed', error.description || error.message || 'Please try again');
      }
      console.log('Payment Error:', error);
    }
  };

  const handleGoBack = () => {
    if (loading || paymentInProgress) {
      Alert.alert(
        'Payment in Progress',
        'Please wait for the payment to complete or cancel it first.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Complete payment to join the game</Text>
        
        <View style={styles.gameInfo}>
          <Text style={styles.infoText}>Players: {playerCount}</Text>
          <Text style={styles.infoText}>Entry Fee: ₹{amount}</Text>
          <Text style={styles.infoText}>Winner Prize: ₹{Math.floor(amount * playerCount * (config.PAYMENT_CONFIG?.WINNER_PERCENTAGE || 0.9))}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, (loading || paymentInProgress) && styles.disabledButton]}
          onPress={handlePayment}
          disabled={loading || paymentInProgress}>
          {loading || paymentInProgress ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#FFF" size="small" />
              <Text style={styles.loadingText}>
                {paymentInProgress ? 'Processing Payment...' : 'Creating Order...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleGoBack}
          disabled={loading || paymentInProgress}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 48,
    textAlign: 'center',
    lineHeight: 24,
  },
  gameInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 48,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  infoText: {
    fontSize: 20,
    color: '#FFF',
    marginBottom: 16,
    fontWeight: '500',
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  payButtonText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 10,
    fontWeight: '500',
  },
  backButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
});

export default PaymentScreen;
