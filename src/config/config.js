// Configuration file for the Ludo Game App

// Function to get local IP address for development
const getDevServerUrl = () => {
  // For Android emulator
  if (__DEV__) {
    // Try different common development URLs
    return 'http://10.0.2.2:8080'; // Android emulator default
    // For physical device, you might need to use your computer's IP
    // return 'http://192.168.1.100:8080'; // Replace with your actual IP
  }
  return 'http://localhost:8080';
};

const config = {
  // Server configuration
  SERVER_URL: getDevServerUrl(),
  
  // API Base URL
  API_BASE_URL: `${getDevServerUrl()}/api`,
  
  // Alternative URLs for different environments
  SERVER_URLS: {
    ANDROID_EMULATOR: 'http://10.0.2.2:8080',
    IOS_SIMULATOR: 'http://localhost:8080',
    PHYSICAL_DEVICE: 'http://192.168.1.100:8080', // Replace with your computer's IP
    PRODUCTION: 'https://your-production-domain.com'
  },
  
  // API URLs for different environments
  API_URLS: {
    ANDROID_EMULATOR: 'http://10.0.2.2:8080/api',
    IOS_SIMULATOR: 'http://localhost:8080/api',
    PHYSICAL_DEVICE: 'http://192.168.1.100:8080/api', // Replace with your computer's IP
    PRODUCTION: 'https://your-production-domain.com/api'
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
    RAZORPAY_KEY_ID: 'rzp_test_ILhEsA5oxLGYj5',
    CURRENCY: 'INR',
    ENTRY_FEES: {
      2: 10, // 2 players: ₹10
      4: 20, // 4 players: ₹20
    },
    WINNER_PERCENTAGE: 0.8, // 80% of total pool goes to winner
  },
};

export default config;