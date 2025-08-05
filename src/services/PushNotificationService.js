import messaging from '@react-native-firebase/messaging';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config/config';

// Suppress Firebase deprecation warnings for now
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0] && args[0].includes && args[0].includes('deprecated')) {
    return; // Suppress deprecation warnings
  }
  originalWarn.apply(console, args);
};



class PushNotificationService {
  constructor() {
    this.initialized = false;
    this.token = null;
    this.messagingInstance = null;
    this.registrationInProgress = false;
    this.tokenRegistered = false;
  }

  async initialize() {
    try {
      console.log('🔥 Initializing push notifications...');
      
      // Get messaging instance using modular API
      this.messagingInstance = messaging();
      
      // Add delay to ensure Firebase is ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('📱 Firebase messaging instance created');

      // Request permission for iOS
      if (Platform.OS === 'ios') {
        const authStatus = await this.messagingInstance.requestPermission();
        const enabled =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!enabled) {
          console.log('Push notification permission denied');
          return false;
        }
      }

      // Get FCM token with retry logic
      console.log('🎫 Getting FCM token...');
      const token = await this.getTokenWithRetry();
      
      if (token) {
        this.token = token;
        console.log('✅ FCM Token obtained:', token.substring(0, 50) + '...');
        
        // Store token locally
        await AsyncStorage.setItem('fcm_token', token);
        console.log('💾 Token stored locally');
        
        // Token generated successfully - backend registration is optional
        console.log('📱 Push token ready - backend registration will be attempted later');
        
        // Optional: Register with backend after app is fully loaded (non-blocking)
        if (!this.tokenRegistered && !this.registrationInProgress) {
          setTimeout(() => {
            this.registerTokenWithRetry(token).catch(error => {
              console.log('📱 Backend registration skipped (app works without it):', error.message);
            });
          }, 8000); // Delay registration by 8 seconds
        }
      } else {
        console.log('❌ Failed to get FCM token after retries');
        return false;
      }

      // Listen for token refresh using modular API
      this.messagingInstance.onTokenRefresh(async (newToken) => {
        console.log('🔄 FCM Token refreshed:', newToken.substring(0, 50) + '...');
        this.token = newToken;
        await AsyncStorage.setItem('fcm_token', newToken);
        // Token refreshed - reset registration state and register new token
        this.tokenRegistered = false;
        this.registrationInProgress = false;
        
        setTimeout(() => {
          this.registerTokenWithRetry(newToken).catch(error => {
            console.log('🔄 Token refreshed but backend registration skipped:', error.message);
          });
        }, 3000);
      });

      // Handle foreground messages using modular API
      this.messagingInstance.onMessage(async (remoteMessage) => {
        console.log('Foreground message received:', remoteMessage);
        this.handleForegroundMessage(remoteMessage);
      });

      // Handle background/quit state messages using modular API
      this.messagingInstance.setBackgroundMessageHandler(async (remoteMessage) => {
        console.log('Background message received:', remoteMessage);
      });

      // Handle notification opened from background/quit state using modular API
      this.messagingInstance.onNotificationOpenedApp((remoteMessage) => {
        console.log('Notification opened from background:', remoteMessage);
        this.handleNotificationOpen(remoteMessage);
      });

      // Check if app was opened from a notification using modular API
      const initialNotification = await this.messagingInstance.getInitialNotification();
      if (initialNotification) {
        console.log('App opened from notification:', initialNotification);
        this.handleNotificationOpen(initialNotification);
      }

      this.initialized = true;
      console.log('Push notification service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async getTokenWithRetry(maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 Token generation attempt ${attempt}/${maxRetries}`);
        const token = await this.messagingInstance.getToken();
        
        if (token && token.length > 0) {
          console.log(`✅ Token generated successfully on attempt ${attempt}`);
          return token;
        } else {
          throw new Error('Empty token received');
        }
      } catch (error) {
        console.error(`❌ Token generation attempt ${attempt}/${maxRetries} failed:`, error.message);
        
        if (attempt === maxRetries) {
          console.error('❌ Max retries reached for token generation');
          return null;
        } else {
          // Wait before retrying with exponential backoff
          const waitTime = Math.min(attempt * 3000, 15000); // Max 15 seconds
          console.log(`⏳ Waiting ${waitTime/1000}s before retry ${attempt + 1}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    return null;
  }

  async registerTokenWithRetry(token, maxRetries = 1) {
    // Prevent duplicate registrations
    if (this.registrationInProgress || this.tokenRegistered) {
      console.log('📱 Token registration already completed or in progress, skipping');
      return;
    }
    
    this.registrationInProgress = true;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.registerToken(token);
        console.log(`✅ Push notification backend registration successful`);
        this.tokenRegistered = true;
        this.registrationInProgress = false;
        return; // Success, exit retry loop
      } catch (error) {
        console.log(`📱 Token registration failed (attempt ${attempt}/${maxRetries}) - app continues normally`);
        
        if (attempt === maxRetries) {
          console.log('📱 Push notifications work locally, backend registration optional');
          this.registrationInProgress = false;
          return;
        } else {
          const waitTime = 3000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
  }

  async registerToken(token) {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      if (!authToken) {
        console.log('No auth token found, skipping token registration');
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased to 15 second timeout

      const response = await fetch(`${API_BASE_URL}/api/push-notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          token,
          platform: Platform.OS
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('Device token registered successfully');
      } else {
        throw new Error(result.message || 'Registration failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Token registration request timed out');
      }
      throw error;
    }
  }

  async unregisterToken() {
    try {
      const token = await AsyncStorage.getItem('fcm_token');
      const authToken = await AsyncStorage.getItem('authToken');
      
      if (!token || !authToken) {
        return;
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${API_BASE_URL}/api/push-notifications/unregister-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify({ token }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          console.log('Device token unregistered successfully');
          await AsyncStorage.removeItem('fcm_token');
        }
      }
    } catch (error) {
      console.error('Error unregistering device token:', error);
    }
  }

  handleForegroundMessage(remoteMessage) {
    const { notification, data } = remoteMessage;
    
    if (notification) {
      Alert.alert(
        notification.title || 'Budzee',
        notification.body || 'You have a new notification',
        [
          {
            text: 'Dismiss',
            style: 'cancel'
          },
          {
            text: 'View',
            onPress: () => this.handleNotificationOpen(remoteMessage)
          }
        ]
      );
    }
  }

  handleNotificationOpen(remoteMessage) {
    const { data } = remoteMessage;
    
    if (data && data.type) {
      switch (data.type) {
        case 'game_invite':
          // Navigate to game invitation screen
          console.log('Navigate to game invite:', data);
          break;
        case 'game_result':
          // Navigate to game result screen
          console.log('Navigate to game result:', data);
          break;
        case 'wallet_update':
          // Navigate to wallet screen
          console.log('Navigate to wallet:', data);
          break;
        default:
          // Navigate to home screen
          console.log('Navigate to home');
          break;
      }
    }
  }

  async createNotificationChannel() {
    if (Platform.OS === 'android') {
      try {
        // Channel is already created in AndroidManifest.xml
        console.log('Using notification channel from AndroidManifest.xml');
      } catch (error) {
        console.error('Error with notification channel:', error);
      }
    }
  }

  async checkPermission() {
    try {
      const messagingInstance = this.messagingInstance || messaging();
      const authStatus = await messagingInstance.hasPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  }

  async requestPermission() {
    try {
      const messagingInstance = this.messagingInstance || messaging();
      const authStatus = await messagingInstance.requestPermission();
      return authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
             authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  getToken() {
    return this.token;
  }

  isInitialized() {
    return this.initialized;
  }
}

const pushNotificationService = new PushNotificationService();
export default pushNotificationService;