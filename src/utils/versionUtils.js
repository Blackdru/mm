import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';

const CURRENT_APP_VERSION = '1.0.4'; // Updated for device restriction feature
const VERSION_KEY = 'app_version';
const FORCE_LOGOUT_VERSION = '1.0.4'; // Version that forces logout for device linking

class VersionUtils {
  async checkForceLogout() {
    try {
      const storedVersion = await AsyncStorage.getItem(VERSION_KEY);
      const currentVersion = await DeviceInfo.getVersion();
      
      console.log('Stored version:', storedVersion);
      console.log('Current version:', currentVersion);
      console.log('Force logout version:', FORCE_LOGOUT_VERSION);
      
      // If no stored version or stored version is less than force logout version
      if (!storedVersion || this.compareVersions(storedVersion, FORCE_LOGOUT_VERSION) < 0) {
        console.log('Force logout required due to version update');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking force logout:', error);
      // On error, assume force logout is needed for safety
      return true;
    }
  }

  async clearAuthDataForUpdate() {
    try {
      console.log('Clearing auth data for app update...');
      
      // Clear all auth-related keys
      await AsyncStorage.multiRemove([
        'authToken',
        'userData',
        'showWelcomeBonus'
      ]);
      
      // Set new app version
      await AsyncStorage.setItem(VERSION_KEY, CURRENT_APP_VERSION);
      
      console.log('Auth data cleared and version updated to:', CURRENT_APP_VERSION);
      return true;
    } catch (error) {
      console.error('Error clearing auth data:', error);
      return false;
    }
  }

  async updateAppVersion() {
    try {
      await AsyncStorage.setItem(VERSION_KEY, CURRENT_APP_VERSION);
      console.log('App version updated to:', CURRENT_APP_VERSION);
    } catch (error) {
      console.error('Error updating app version:', error);
    }
  }

  compareVersions(version1, version2) {
    const v1parts = version1.split('.').map(Number);
    const v2parts = version2.split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
      const v1part = v1parts[i] || 0;
      const v2part = v2parts[i] || 0;
      
      if (v1part < v2part) return -1;
      if (v1part > v2part) return 1;
    }
    
    return 0;
  }

  async getCurrentStoredVersion() {
    try {
      return await AsyncStorage.getItem(VERSION_KEY);
    } catch (error) {
      console.error('Error getting stored version:', error);
      return null;
    }
  }
}

export default new VersionUtils();