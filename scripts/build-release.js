const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('📱 Building Budzee Mobile App for Release...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ package.json not found! Run this from the app root directory');
  process.exit(1);
}

// Check React Native CLI
try {
  execSync('npx react-native --version', { stdio: 'pipe' });
} catch (error) {
  console.error('❌ React Native CLI not found! Install with: npm install -g @react-native-community/cli');
  process.exit(1);
}

try {
  // Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  try {
    execSync('npx react-native clean', { stdio: 'inherit' });
  } catch (e) {
    console.log('⚠️ Clean command not available, continuing...');
  }

  // Install dependencies
  console.log('📥 Installing dependencies...');
  execSync('npm install', { stdio: 'inherit' });

  // Build for Android
  console.log('🤖 Building Android APK...');
  execSync('cd android && ./gradlew assembleRelease', { stdio: 'inherit' });

  // Build for iOS (if on macOS)
  if (process.platform === 'darwin') {
    console.log('🍎 Building iOS app...');
    execSync('npx react-native build-ios --configuration Release', { stdio: 'inherit' });
  } else {
    console.log('⚠️ iOS build skipped (not on macOS)');
  }

  console.log('\n✅ Build completed successfully!');
  console.log('\n📱 Release files:');
  console.log('Android: android/app/build/outputs/apk/release/app-release.apk');
  if (process.platform === 'darwin') {
    console.log('iOS: ios/build/Build/Products/Release-iphoneos/');
  }

  console.log('\n📋 Next steps:');
  console.log('1. Test the release build on physical devices');
  console.log('2. Upload to Google Play Store / Apple App Store');
  console.log('3. Update version numbers for next release');

} catch (error) {
  console.error('\n❌ Build failed:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('1. Make sure Android SDK is properly configured');
  console.log('2. Check that all dependencies are installed');
  console.log('3. Verify signing keys are set up correctly');
  process.exit(1);
}