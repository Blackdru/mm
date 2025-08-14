import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';

class DeviceUtils {
  constructor() {
    this.deviceId = null;
  }

  async getDeviceId() {
    try {
      if (this.deviceId) {
        return this.deviceId;
      }

      // Get unique device ID
      this.deviceId = await DeviceInfo.getUniqueId();
      return this.deviceId;
    } catch (error) {
      console.error('Error getting device ID:', error);
      // Fallback to a stored UUID if device ID fails
      return await this.getFallbackDeviceId();
    }
  }

  async getFallbackDeviceId() {
    try {
      let fallbackId = await AsyncStorage.getItem('fallback_device_id');
      if (!fallbackId) {
        // Generate a UUID-like fallback
        fallbackId = 'fallback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        await AsyncStorage.setItem('fallback_device_id', fallbackId);
      }
      return fallbackId;
    } catch (error) {
      console.error('Error with fallback device ID:', error);
      return 'unknown_device_' + Date.now();
    }
  }

  async clearDeviceData() {
    try {
      await AsyncStorage.removeItem('fallback_device_id');
      this.deviceId = null;
    } catch (error) {
      console.error('Error clearing device data:', error);
    }
  }
}

export default new DeviceUtils();