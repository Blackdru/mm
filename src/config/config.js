// Production Configuration for React Native App
import { Platform } from 'react-native';

// Production server configuration
const PRODUCTION_SERVER_URL = 'https://test.fivlog.space';
const DEVELOPMENT_SERVER_IP = 'localhost';
const DEVELOPMENT_SERVER_PORT = '8080';

// Force localhost for development (set to false when ready for production)
const FORCE_LOCALHOST = false;

// Determine if we're in production or development
const __DEV__ = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// URL selection based on environment
let SERVER_URL;
let API_URL;

if (__DEV__ || FORCE_LOCALHOST) {
  // Development mode - use local server
  if (Platform.OS === 'android') {
    // Android emulator - connect to localhost backend
    SERVER_URL = 'http://10.0.2.2:8080';
    API_URL = 'http://10.0.2.2:8080/api';
  } else if (Platform.OS === 'ios') {
    // iOS simulator
    SERVER_URL = 'http://localhost:8080';
    API_URL = 'http://localhost:8080/api';
  } else {
    // Physical device in development - use localhost
    // Note: For physical Android device, you may need to use your computer's IP address
    // For example: '192.168.1.100' instead of 'localhost'
    SERVER_URL = `http://localhost:${DEVELOPMENT_SERVER_PORT}`;
    API_URL = `http://localhost:${DEVELOPMENT_SERVER_PORT}/api`;
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

  // Socket.io configuration - ENHANCED
  SOCKET_CONFIG: {
    transports: ['polling', 'websocket'], // Try polling first
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    maxReconnectionAttempts: 5,
    forceNew: false,
    upgrade: true,
    rememberUpgrade: true,
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
console.log('Force Localhost:', FORCE_LOCALHOST);
console.log('Platform:', Platform.OS);
console.log('Server URL:', config.SERVER_URL);
console.log('API URL:', config.API_BASE_URL);
console.log('Socket transports:', config.SOCKET_CONFIG.transports);

// Connection test (only in development or when forced to localhost)
if (__DEV__ || FORCE_LOCALHOST) {
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
      console.log('💡 If using physical device, you may need to use your computer\'s IP address instead of localhost');
    });
}

export default config;