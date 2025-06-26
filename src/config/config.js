// Configuration file for the Ludo Game App

const BASE_URL = 'http://192.168.180.58:8080';

const config = {
  // Server configuration
  SERVER_URL: BASE_URL,

  // API Base URL
  API_BASE_URL: `${BASE_URL}/api`,

  // All possible URLs (optional for testing or reference)
  SERVER_URLS: {
    ANDROID_EMULATOR: 'http://10.0.2.2:8080',
    IOS_SIMULATOR: 'http://localhost:8080',
    PHYSICAL_DEVICE: 'http://192.168.180.58:8080',
    PRODUCTION: 'http://192.168.180.58:8080',
  },

  API_URLS: {
    ANDROID_EMULATOR: 'http://10.0.2.2:8080/api',
    IOS_SIMULATOR: 'http://localhost:8080/api',
    PHYSICAL_DEVICE: 'http://192.168.180.58:8080/api',
    PRODUCTION: 'http://192.168.180.58:8080/api',
  },

  // Socket.io configuration
  SOCKET_CONFIG: {
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  },

  // Game configuration
  GAME_CONFIG: {
    PLAYER_COLORS: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    DICE_ANIMATION_DURATION: 500,
    TURN_TIMEOUT: 30000, // 30 seconds per turn
  },

  // Payment configuration
  PAYMENT_CONFIG: {
    RAZORPAY_KEY_ID: 'rzp_live_MCNGWPQMBHG7sC',
    CURRENCY: 'INR',
    ENTRY_FEES: {
      2: 10, // 2 players: ₹10
      4: 20, // 4 players: ₹20
    },
    WINNER_PERCENTAGE: 0.8, // 80% of total pool goes to winner
  },
};

export default config;
