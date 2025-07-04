import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import RazorpayNativeCheckout from '../utils/RazorpayNative';
import config from '../config/config';

const PaymentScreen = ({navigation, route}) => {
  const {playerCount} = route.params;
  const [loading, setLoading] = useState(false);
  const amount = config.PAYMENT_CONFIG.ENTRY_FEES[playerCount];

  const handlePayment = async () => {
    setLoading(true);
    
    try {
      // First create order from backend
      const response = await fetch(`${config.SERVER_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amount,
          playerCount: playerCount,
        }),
      });

      const orderData = await response.json();
      
      if (!orderData.success) {
        throw new Error('Failed to create order');
      }

      // Force native checkout by using minimal configuration
      const options = {
        description: `Memory Game - ${playerCount} Players`,
        currency: config.PAYMENT_CONFIG.CURRENCY,
        key: config.PAYMENT_CONFIG.RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        name: 'Budzee Gaming',
        order_id: orderData.order.id,
        prefill: {
          email: 'player@budzee.com',
          contact: '9999999999',
          name: 'Player'
        },
        theme: {
          color: '#FF6B35'
        },
        // Disable webview and force native
        send_sms_hash: true,
        allow_rotation: false,
        // Force native methods only
        method: {
          netbanking: true,
          card: true,
          upi: true,
          wallet: true,
          emi: false,
          paylater: false
        }
      };

      console.log('Opening Razorpay with native configuration:', options);
      
      // Try our custom native module first, fallback to regular if not available
      let data;
      try {
        data = await RazorpayNativeCheckout.open(options);
        console.log('Used native checkout module');
      } catch (nativeError) {
        console.log('Native module not available, using fallback:', nativeError);
        data = await RazorpayCheckout.open(options);
      }
      console.log('Payment Success:', data);
      
      // Verify payment with backend
      const verifyResponse = await fetch(`${config.SERVER_URL}/api/verify-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
        }),
      });

      const verifyData = await verifyResponse.json();
      
      if (verifyData.success) {
        setLoading(false);
        navigation.navigate('Game', {playerCount, paymentConfirmed: true});
      } else {
        throw new Error('Payment verification failed');
      }
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Payment Failed', error.message || 'Please try again');
      console.log('Payment Error:', error);
    }
  };

  const handleMockPayment = () => {
    // For testing purposes
    navigation.navigate('Game', {playerCount, paymentConfirmed: true});
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Payment</Text>
        <Text style={styles.subtitle}>Complete payment to join the game</Text>
        
        <View style={styles.gameInfo}>
          <Text style={styles.infoText}>Players: {playerCount}</Text>
          <Text style={styles.infoText}>Entry Fee: ₹{amount}</Text>
          <Text style={styles.infoText}>Winner Prize: ₹{Math.floor(amount * playerCount * config.PAYMENT_CONFIG.WINNER_PERCENTAGE)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.payButton, loading && styles.disabledButton]}
          onPress={handlePayment}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.payButtonText}>Pay ₹{amount}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mockButton}
          onPress={handleMockPayment}>
          <Text style={styles.mockButtonText}>Skip Payment (Demo)</Text>
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
  mockButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#666',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  mockButtonText: {
    fontSize: 18,
    color: '#666',
    fontWeight: '500',
  },
});

export default PaymentScreen;
