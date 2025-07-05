// Production Configuration for React Native App
import { Platform } from 'react-native';

// Production server configuration
const PRODUCTION_SERVER_URL = 'https://test.fivlog.space';
const DEVELOPMENT_SERVER_IP = '172.23.141.58';
const DEVELOPMENT_SERVER_PORT = '8080';

// Determine if we're in production or development
const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// URL selection based on environment
let SERVER_URL;
let API_URL;

if (__DEV__) {
  // Development mode - use local server
  if (Platform.OS === 'android') {
    // Android emulator
    SERVER_URL = 'http://10.0.2.2:8080';
    API_URL = 'http://10.0.2.2:8080/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator
    SERVER_URL = 'http://localhost:8080';
    API_URL = 'http://localhost:8080/api';
  } else {
    // Physical device in development
    SERVER_URL = `http://${DEVELOPMENT_SERVER_IP}:${DEVELOPMENT_SERVER_PORT}`;
    API_URL = `http://${DEVELOPMENT_SERVER_IP}:${DEVELOPMENT_SERVER_PORT}/api`;
  }
} else {
  // Production mode - use production server
  SERVER_URL = PRODUCTION_SERVER_URL;
  API_URL = `${PRODUCTION_SERVER_URL}/api`;
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

  // Payment configuration - API key will be fetched from backend
  PAYMENT_CONFIG: {
    CURRENCY: 'INR',
    ENTRY_FEES: {
      2: 10,
      4: 20,
    },
    WINNER_PERCENTAGE: 0.8,
  },
};

// Enhanced debug logging
console.log('🔧 Network Config:');
console.log('Environment:', __DEV__ ? 'Development' : 'Production');
console.log('Platform:', Platform.OS);
console.log('Server URL:', config.SERVER_URL);
console.log('API URL:', config.API_BASE_URL);
console.log('Socket transports:', config.SOCKET_CONFIG.transports);

// Connection test (only in development)
if (__DEV__) {
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
}

export default config;