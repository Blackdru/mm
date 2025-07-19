import RNFS from 'react-native-fs';
import { Linking, Alert, Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import config from '../config/config';

const { ApkInstaller } = NativeModules;

class UpdateService {
  constructor() {
    this.currentVersion = '1.0.1'; 
    this.updateCheckUrl = `${config.SERVER_URL}/updates/latest-version.json`;
    this.lastCheckTime = 0;
    this.minCheckInterval = 5 * 60 * 1000; // 5 minutes minimum between checks
    this.rateLimitRetryDelay = 60 * 1000; // 1 minute delay for rate limit
    this.maxRetries = 3;
  }

  // Fix APK URL to use correct server address for the device
  fixApkUrl(originalUrl) {
    try {
      if (!originalUrl) return null;
      
      // If URL contains localhost, replace with the correct server URL
      if (originalUrl.includes('localhost:8080')) {
        return originalUrl.replace('http://localhost:8080', config.SERVER_URL);
      }
      
      return originalUrl;
    } catch (error) {
      console.error('❌ Error fixing APK URL:', error);
      return originalUrl;
    }
  }

  async checkForUpdates(forceCheck = false) {
    try {
      // Rate limiting: Check if enough time has passed since last check
      const now = Date.now();
      if (!forceCheck && (now - this.lastCheckTime) < this.minCheckInterval) {
        const remainingTime = Math.ceil((this.minCheckInterval - (now - this.lastCheckTime)) / 1000);
        console.log(`⏰ Rate limited: Please wait ${remainingTime} seconds before checking again`);
        return {
          hasUpdate: false,
          updateInfo: null,
          error: `Please wait ${remainingTime} seconds before checking again`
        };
      }

      console.log('🔍 Checking for app updates...');
      console.log('🌐 Update check URL:', this.updateCheckUrl);
      
      return await this.performUpdateCheckWithRetry();
      
    } catch (error) {
      console.error('❌ Error checking for updates:', error);
      return {
        hasUpdate: false,
        updateInfo: null,
        error: error.message
      };
    }
  }

  async performUpdateCheckWithRetry(retryCount = 0) {
    try {
      const response = await fetch(this.updateCheckUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'User-Agent': 'Budzee-App/1.0.1'
        },
        timeout: 10000 // 10 second timeout
      });
      
      // Handle rate limiting (429 Too Many Requests)
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.rateLimitRetryDelay;
        
        console.log(`⏰ Rate limited (429). Waiting ${waitTime / 1000} seconds...`);
        
        if (retryCount < this.maxRetries) {
          console.log(`🔄 Retrying in ${waitTime / 1000} seconds... (Attempt ${retryCount + 1}/${this.maxRetries})`);
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.performUpdateCheckWithRetry(retryCount + 1);
        } else {
          throw new Error('Server is busy. Please try again later.');
        }
      }
      
      // Handle other HTTP errors
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error('Update server is temporarily unavailable. Please try again later.');
        } else if (response.status === 404) {
          throw new Error('Update service not found. Please contact support.');
        } else {
          throw new Error(`Server error ${response.status}: ${response.statusText}`);
        }
      }
      
      // Update last check time on successful request
      this.lastCheckTime = Date.now();
      
      const updateInfo = await response.json();
      
      console.log('📱 Current version:', this.currentVersion);
      console.log('🆕 Remote version:', updateInfo.version);
      console.log('📦 Original APK URL:', updateInfo.apkUrl);
      
      // Fix the APK URL for the current device
      updateInfo.apkUrl = this.fixApkUrl(updateInfo.apkUrl);
      console.log('🔧 Fixed APK URL:', updateInfo.apkUrl);
      
      if (this.isNewerVersion(updateInfo.version, this.currentVersion)) {
        console.log('✅ New version available:', updateInfo.version);
        return {
          hasUpdate: true,
          updateInfo
        };
      } else {
        console.log('✅ App is up to date');
        return {
          hasUpdate: false,
          updateInfo: null
        };
      }
      
    } catch (error) {
      // Handle network errors with retry logic
      if (error.message.includes('Network request failed') || error.message.includes('timeout')) {
        if (retryCount < this.maxRetries) {
          const waitTime = Math.min(1000 * Math.pow(2, retryCount), 10000); // Exponential backoff, max 10s
          console.log(`🔄 Network error, retrying in ${waitTime / 1000} seconds... (Attempt ${retryCount + 1}/${this.maxRetries})`);
          
          await new Promise(resolve => setTimeout(resolve, waitTime));
          return await this.performUpdateCheckWithRetry(retryCount + 1);
        }
      }
      
      throw error;
    }
  }

  isNewerVersion(remoteVersion, currentVersion) {
    try {
      const remote = remoteVersion.split('.').map(Number);
      const current = currentVersion.split('.').map(Number);
      
      for (let i = 0; i < Math.max(remote.length, current.length); i++) {
        const r = remote[i] || 0;
        const c = current[i] || 0;
        
        if (r > c) return true;
        if (r < c) return false;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error comparing versions:', error);
      return false;
    }
  }

  async requestStoragePermission() {
    try {
      if (Platform.OS !== 'android') {
        return true; // iOS doesn't need explicit permission
      }

      const androidVersion = Platform.Version;
      console.log('📱 Android version:', androidVersion);

      // Android 13+ (API 33+) doesn't need storage permission for app-specific directories
      if (androidVersion >= 33) {
        console.log('✅ Android 13+: No storage permission needed');
        return true;
      }

      // Android 11-12 (API 30-32) - request storage permission
      if (androidVersion >= 30) {
        console.log('📋 Requesting storage permission for Android 11-12...');
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission',
              message: 'App needs storage permission to download updates',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        } catch (err) {
          console.error('❌ Permission request error:', err);
          return false;
        }
      }

      // Android 10 and below - request storage permission
      console.log('📋 Requesting storage permission for Android 10 and below...');
      const permission = PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE;
      const result = await request(permission);
      return result === RESULTS.GRANTED;

    } catch (error) {
      console.error('❌ Error requesting storage permission:', error);
      return false;
    }
  }

  async downloadAndInstallUpdate(updateInfo, onProgress, onPermissionRequired) {
    try {
      console.log('📥 Starting APK download...');
      console.log('📱 Platform:', Platform.OS, 'Version:', Platform.Version);
      
      // Validate update info
      if (!updateInfo) {
        throw new Error('No update information provided');
      }

      if (!updateInfo.apkUrl || updateInfo.apkUrl === 'null' || updateInfo.apkUrl === null) {
        throw new Error('Invalid APK download URL. Please check server configuration.');
      }

      console.log('🌐 Download URL:', updateInfo.apkUrl);

      // Request storage permission
      const hasPermission = await this.requestStoragePermission();
      if (!hasPermission) {
        throw new Error('Storage permission is required to download updates. Please grant permission in app settings.');
      }

      // Determine download path based on Android version
      let downloadPath;
      if (Platform.OS === 'android') {
        if (Platform.Version >= 29) {
          // Android 10+ - use app-specific directory (no permission needed)
          downloadPath = `${RNFS.DocumentDirectoryPath}/Budzee-update.apk`;
        } else {
          // Android 9 and below - use Downloads directory
          downloadPath = `${RNFS.DownloadDirectoryPath}/Budzee-update.apk`;
        }
      } else {
        // iOS
        downloadPath = `${RNFS.DocumentDirectoryPath}/Budzee-update.apk`;
      }
      
      console.log('📁 Download path:', downloadPath);
      
      // Remove existing file if it exists
      try {
        if (await RNFS.exists(downloadPath)) {
          await RNFS.unlink(downloadPath);
          console.log('🗑️ Removed existing file');
        }
      } catch (unlinkError) {
        console.warn('⚠️ Could not remove existing file:', unlinkError.message);
      }

      // Test network connectivity by trying to fetch the APK URL
      console.log('🔍 Testing network connectivity...');
      try {
        const testResponse = await fetch(updateInfo.apkUrl, { 
          method: 'HEAD',
          timeout: 5000 
        });
        
        if (!testResponse.ok) {
          throw new Error(`Server returned ${testResponse.status}: ${testResponse.statusText}`);
        }
        
        const contentLength = testResponse.headers.get('content-length');
        console.log('✅ Network test passed. File size:', contentLength ? `${(contentLength / 1024 / 1024).toFixed(2)} MB` : 'Unknown');
      } catch (networkError) {
        throw new Error(`Network connectivity test failed: ${networkError.message}. Please check your internet connection and server status.`);
      }

      // Download the APK with enhanced error handling
      console.log('📥 Starting download...');
      const downloadResult = await RNFS.downloadFile({
        fromUrl: updateInfo.apkUrl,
        toFile: downloadPath,
        headers: {
          'Accept': 'application/vnd.android.package-archive',
          'User-Agent': 'Budzee-App-Updater/1.0'
        },
        progress: (res) => {
          if (res.contentLength > 0) {
            const progress = (res.bytesWritten / res.contentLength) * 100;
            console.log(`📥 Download progress: ${progress.toFixed(1)}% (${res.bytesWritten}/${res.contentLength} bytes)`);
            if (onProgress) {
              onProgress(progress);
            }
          } else {
            console.log(`📥 Downloaded: ${res.bytesWritten} bytes`);
            if (onProgress) {
              onProgress(50); // Show some progress even if content-length is unknown
            }
          }
        },
        progressDivider: 1,
        begin: (res) => {
          console.log('📥 Download started. Status:', res.statusCode, 'Content-Length:', res.contentLength);
        }
      }).promise;

      console.log('📥 Download result:', downloadResult);

      if (downloadResult.statusCode === 200) {
        console.log('✅ APK downloaded successfully');
        
        // Verify file exists and has content
        const fileExists = await RNFS.exists(downloadPath);
        if (!fileExists) {
          throw new Error('Downloaded file not found after successful download');
        }

        const fileStats = await RNFS.stat(downloadPath);
        console.log('📊 Downloaded file size:', fileStats.size, 'bytes');
        
        if (fileStats.size < 1000) {
          throw new Error(`Downloaded file appears to be corrupted (size: ${fileStats.size} bytes). Please try again.`);
        }

        // Verify it's actually an APK file (basic check)
        try {
          const fileContent = await RNFS.read(downloadPath, 4, 0, 'base64');
          // APK files start with "PK" (ZIP signature)
          const decoded = Buffer.from(fileContent, 'base64').toString('ascii');
          if (!decoded.startsWith('PK')) {
            console.warn('⚠️ Downloaded file may not be a valid APK');
          }
        } catch (verifyError) {
          console.warn('⚠️ Could not verify APK file format:', verifyError.message);
        }
        
        // Install the APK
        const installResult = await this.installApk(downloadPath, onPermissionRequired);
        
        if (installResult.permissionRequired) {
          return { 
            success: false, 
            permissionRequired: true, 
            filePath: downloadPath 
          };
        }
        
        return { success: true, filePath: downloadPath };
      } else {
        throw new Error(`Download failed with HTTP status: ${downloadResult.statusCode}. Please check your internet connection and try again.`);
      }
      
    } catch (error) {
      console.error('❌ Error downloading/installing update:', error);
      
      // Provide more specific error messages
      let userFriendlyMessage = error.message;
      
      if (error.message.includes('Network request failed')) {
        userFriendlyMessage = 'Network connection failed. Please check your internet connection and try again.';
      } else if (error.message.includes('timeout')) {
        userFriendlyMessage = 'Download timed out. Please check your internet connection and try again.';
      } else if (error.message.includes('ENOENT')) {
        userFriendlyMessage = 'File system error. Please restart the app and try again.';
      } else if (error.message.includes('Permission denied')) {
        userFriendlyMessage = 'Permission denied. Please grant storage permission in app settings.';
      }
      
      return { success: false, error: userFriendlyMessage };
    }
  }

  async checkInstallPermission() {
    try {
      if (Platform.OS !== 'android') {
        return true; // iOS doesn't need install permission
      }

      if (!ApkInstaller) {
        console.warn('⚠️ ApkInstaller native module not available');
        return false;
      }

      const hasPermission = await ApkInstaller.checkInstallPermission();
      console.log('📋 Install permission status:', hasPermission);
      return hasPermission;
    } catch (error) {
      console.error('❌ Error checking install permission:', error);
      return false;
    }
  }

  async requestInstallPermission() {
    try {
      if (Platform.OS !== 'android') {
        return true; // iOS doesn't need install permission
      }

      if (!ApkInstaller) {
        console.warn('⚠️ ApkInstaller native module not available');
        return false;
      }

      await ApkInstaller.requestInstallPermission();
      console.log('📋 Install permission request initiated');
      
      // Show user guidance
      Alert.alert(
        'Install Permission Required',
        'Please enable "Install from unknown sources" for this app in the settings that just opened, then try the update again.',
        [{ text: 'OK' }]
      );
      
      return true;
    } catch (error) {
      console.error('❌ Error requesting install permission:', error);
      return false;
    }
  }

  async installApk(apkPath, onPermissionRequired) {
    try {
      console.log('📱 Installing APK from:', apkPath);
      
      if (Platform.OS !== 'android') {
        throw new Error('APK installation is only supported on Android');
      }

      // Check if we have install permission (Android 8.0+)
      const hasInstallPermission = await this.checkInstallPermission();
      if (!hasInstallPermission) {
        console.log('📋 Install permission required, requesting...');
        
        if (onPermissionRequired) {
          // Call the callback to notify UI about permission requirement
          onPermissionRequired(apkPath);
        }
        
        await this.requestInstallPermission();
        return { permissionRequired: true, filePath: apkPath };
      }

      return await this.installApkDirect(apkPath);
      
    } catch (error) {
      console.error('❌ Error installing APK:', error);
      
      // Show user-friendly installation instructions
      Alert.alert(
        'Installation Help',
        `The update has been downloaded successfully, but automatic installation encountered an issue.\n\nTo install manually:\n1. Go to your Downloads folder\n2. Find "Budzee-update.apk"\n3. Tap to install\n4. Allow installation from unknown sources if prompted\n\nError: ${error.message}`,
        [{ text: 'OK' }]
      );
      
      throw error;
    }
  }

  async installApkDirect(apkPath) {
    try {
      console.log('📱 Installing APK directly from:', apkPath);
      
      if (Platform.OS !== 'android') {
        throw new Error('APK installation is only supported on Android');
      }

      // Try using native module first (most reliable)
      if (ApkInstaller) {
        try {
          console.log('🔧 Using native ApkInstaller module...');
          const result = await ApkInstaller.installApk(apkPath);
          console.log('✅ Native APK installation initiated:', result);
          
          // Don't show alert here - let the calling component handle UI
          return { success: true };
        } catch (nativeError) {
          console.warn('⚠️ Native installer failed:', nativeError.message);
          // Fall back to Linking method
        }
      }

      // Fallback: Try using Linking (may not work on modern Android)
      console.log('🔄 Falling back to Linking method...');
      
      try {
        const fileUri = `file://${apkPath}`;
        const canOpen = await Linking.canOpenURL(fileUri);
        
        if (canOpen) {
          await Linking.openURL(fileUri);
          console.log('✅ APK installation initiated with Linking');
          return { success: true };
        }
      } catch (linkingError) {
        console.warn('⚠️ Linking method failed:', linkingError.message);
      }

      // If all automatic methods fail, show manual installation instructions
      console.log('📋 All automatic methods failed, showing manual instructions');
      
      Alert.alert(
        'Manual Installation Required',
        `The update has been downloaded successfully. Please install it manually:\n\n1. Open your file manager or Downloads app\n2. Find "Budzee-update.apk"\n3. Tap on the file to install\n4. Follow the installation prompts\n\nFile location: ${apkPath}`,
        [
          {
            text: 'Open Downloads',
            onPress: () => {
              // Try to open Downloads app
              Linking.openURL('content://com.android.externalstorage.documents/root/primary/Download').catch(() => {
                // Fallback to file manager
                Linking.openURL('content://com.android.externalstorage.documents/root/primary').catch(() => {
                  console.log('Could not open file manager');
                });
              });
            }
          },
          { text: 'OK' }
        ]
      );
      
      return { success: true }; // Consider manual instructions as success
      
    } catch (error) {
      console.error('❌ Error installing APK directly:', error);
      throw error;
    }
  }

  showUpdateDialog(updateInfo, onUpdate, onSkip) {
    const { version, type, notes } = updateInfo;
    const isMandatory = type === 'mandatory';
    
    const title = isMandatory ? 'Update Required' : 'Update Available';
    const message = `Version ${version} is now available.\n\n${notes}`;
    
    const buttons = [
      {
        text: 'Update Now',
        onPress: onUpdate,
        style: 'default'
      }
    ];
    
    if (!isMandatory) {
      buttons.unshift({
        text: 'Skip',
        onPress: onSkip,
        style: 'cancel'
      });
    }
    
    Alert.alert(title, message, buttons, {
      cancelable: !isMandatory
    });
  }

  showDownloadProgress(progress) {
    console.log(`📥 Download progress: ${progress.toFixed(1)}%`);
  }
}

export default new UpdateService();