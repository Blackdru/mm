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

      // Razorpay integration
      const options = {
        description: `Ludo Game - ${playerCount} Players`,
        image: 'https://your-logo-url.com/logo.png',
        currency: config.PAYMENT_CONFIG.CURRENCY,
        key: config.PAYMENT_CONFIG.RAZORPAY_KEY_ID,
        amount: amount * 100, // Amount in paise
        name: 'Ludo Master',
        order_id: orderData.order.id,
        prefill: {
          email: 'user@example.com',
          contact: '9999999999',
          name: 'Player Name'
        },
        theme: {color: '#FF6B6B'}
      };

      const data = await RazorpayCheckout.open(options);
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
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFF',
    marginBottom: 40,
    textAlign: 'center',
  },
  gameInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 20,
    marginBottom: 40,
    width: '100%',
  },
  infoText: {
    fontSize: 18,
    color: '#FFF',
    marginBottom: 10,
  },
  payButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  disabledButton: {
    backgroundColor: '#666',
  },
  payButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mockButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#666',
    borderRadius: 10,
    padding: 15,
    width: '100%',
    alignItems: 'center',
  },
  mockButtonText: {
    fontSize: 16,
    color: '#666',
  },
});

export default PaymentScreen;
