// FIXED Configuration for React Native App
import { Platform } from 'react-native';

// HARDCODED IP - Change this if your IP changes
const SERVER_IP = '192.168.126.58';
const SERVER_PORT = '8080';

// Simple URL selection based on platform
let SERVER_URL;
let API_URL;

if (Platform.OS === 'android') {
  // Android emulator
  SERVER_URL = 'http://10.0.2.2:8080';
  API_URL = 'http://10.0.2.2:8080/api';
} else if (Platform.OS === 'ios') {
  // iOS simulator
  SERVER_URL = 'http://localhost:8080';
  API_URL = 'http://localhost:8080/api';
} else {
  // Physical device or unknown platform
  SERVER_URL = `http://${SERVER_IP}:${SERVER_PORT}`;
  API_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;
}

const config = {
  // Server configuration
  SERVER_URL: SERVER_URL,
  API_BASE_URL: API_URL,

  // Socket.io configuration - SIMPLIFIED
  SOCKET_CONFIG: {
    transports: ['polling', 'websocket'], // Try polling first
    timeout: 10000,
    reconnection: true,
    reconnectionAttempts: 3,
    reconnectionDelay: 2000,
    forceNew: false,
  },

  // Game configuration
  GAME_CONFIG: {
    PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    DICE_ANIMATION_DURATION: 500,
    TURN_TIMEOUT: 30000,
  },

  // Payment configuration
  PAYMENT_CONFIG: {
    RAZORPAY_KEY_ID: 'rzp_live_MCNGWPQMBHG7sC',
    CURRENCY: 'INR',
    ENTRY_FEES: {
      2: 10,
      4: 20,
    },
    WINNER_PERCENTAGE: 0.8,
  },
};

// Enhanced debug logging
console.log('🔧 FIXED Network Config:');
console.log('Platform:', Platform.OS);
console.log('Server URL:', config.SERVER_URL);
console.log('API URL:', config.API_BASE_URL);
console.log('Socket transports:', config.SOCKET_CONFIG.transports);

// Immediate connection test
console.log('🧪 Testing connection...');
fetch(`${config.SERVER_URL}/health`)
  .then(response => {
    console.log('✅ Health check SUCCESS:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('✅ Server status:', data.status);
  })
  .catch(error => {
    console.log('❌ Health check FAILED:', error.message);
    console.log('💡 Make sure backend is running on:', config.SERVER_URL);
  });

export default config;