import React, { useEffect, useState, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, AppState, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import UpdateService from '../services/UpdateService';
import { theme } from '../styles/theme';

const { width: screenWidth } = Dimensions.get('window');

const UpdateChecker = () => {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [waitingForPermission, setWaitingForPermission] = useState(false);
  const [downloadedFilePath, setDownloadedFilePath] = useState(null);
  const appState = useRef(AppState.currentState);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    checkForUpdates();
    
    // Only check once on startup, no periodic checks
    
    // Pulse animation for the update icon
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();
    
    // Listen for app state changes to handle permission flow
    const handleAppStateChange = (nextAppState) => {
      console.log('📱 App state changed:', appState.current, '->', nextAppState);
      
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('📱 App came to foreground');
        
        // If we were waiting for permission and user came back
        if (waitingForPermission && updateInfo) {
          console.log('🔄 Checking permission after user returned from settings');
          handlePermissionReturn();
        }
      }
      
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      pulseAnimation.stop();
    };
  }, [waitingForPermission, updateInfo]);

  const checkForUpdates = async () => {
    try {
      console.log('🔍 UpdateChecker: Checking for updates...');
      const result = await UpdateService.checkForUpdates();
      
      if (result.hasUpdate) {
        console.log('✅ UpdateChecker: Update available:', result.updateInfo.version);
        setUpdateInfo(result.updateInfo);
        setShowModal(true);
        setError(null);
      } else if (result.error) {
        console.log('❌ UpdateChecker: Error checking updates:', result.error);
        setError(result.error);
      } else {
        console.log('✅ UpdateChecker: App is up to date');
      }
    } catch (error) {
      console.error('❌ UpdateChecker: Exception checking for updates:', error);
      setError(error.message);
    }
  };

  const handlePermissionReturn = async () => {
    console.log('🔄 User returned from permission settings');
    setWaitingForPermission(false);
    
    // Check if permission is now granted
    const hasPermission = await UpdateService.checkInstallPermission();
    console.log('📋 Permission status after return:', hasPermission);
    
    if (hasPermission && downloadedFilePath) {
      console.log('✅ Permission granted, attempting installation...');
      try {
        await UpdateService.installApkDirect(downloadedFilePath);
        console.log('✅ Installation initiated after permission grant');
        
        // For mandatory updates, keep modal open until installation completes
        if (updateInfo.type === 'mandatory') {
          setError('Please complete the installation to continue using the app.');
        } else {
          setShowModal(false);
        }
      } catch (error) {
        console.error('❌ Installation failed after permission grant:', error);
        setError('Installation failed. Please try again or install manually.');
      }
    } else if (hasPermission && !downloadedFilePath) {
      console.log('🔄 Permission granted but no downloaded file, restarting update...');
      handleUpdate();
    } else {
      console.log('❌ Permission still not granted');
      setError('Install permission is required for automatic updates. Please enable it in settings or install manually.');
    }
  };

  const handleUpdate = async () => {
    if (!updateInfo) return;
    
    console.log('🚀 UpdateChecker: Starting update process...');
    setDownloading(true);
    setDownloadProgress(0);
    setError(null);
    setWaitingForPermission(false);
    setDownloadedFilePath(null);
    
    try {
      const result = await UpdateService.downloadAndInstallUpdate(
        updateInfo,
        (progress) => {
          console.log(`📥 UpdateChecker: Download progress: ${progress.toFixed(1)}%`);
          setDownloadProgress(progress);
        },
        // Pass callback for permission request
        (filePath) => {
          console.log('📋 Permission required, file downloaded to:', filePath);
          setDownloadedFilePath(filePath);
          setWaitingForPermission(true);
          setDownloading(false);
          setError('Please enable "Install from unknown sources" in the settings that opened, then return to this app.');
        }
      );
      
      if (result.success) {
        console.log('✅ UpdateChecker: Update completed successfully');
        
        // For mandatory updates, show completion message but keep modal
        if (updateInfo.type === 'mandatory') {
          setError('Installation started. Please complete the installation to continue.');
          setDownloading(false);
        } else {
          setShowModal(false);
          setDownloading(false);
        }
      } else if (result.permissionRequired) {
        console.log('📋 UpdateChecker: Permission required');
        setWaitingForPermission(true);
        setDownloading(false);
        setDownloadedFilePath(result.filePath);
        setError('Please enable "Install from unknown sources" in settings, then return to this app.');
      } else {
        console.error('❌ UpdateChecker: Update failed:', result.error);
        setError(result.error);
        setDownloading(false);
      }
    } catch (error) {
      console.error('❌ UpdateChecker: Exception during update:', error);
      setError(error.message);
      setDownloading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    handleUpdate();
  };

  const handleSkip = () => {
    console.log('⏭️ UpdateChecker: User skipped update');
    setShowModal(false);
    setUpdateInfo(null);
    setError(null);
    setDownloading(false);
    setDownloadProgress(0);
  };

  if (!showModal || !updateInfo) {
    return null;
  }

  const isMandatory = updateInfo.type === 'mandatory';

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
      onRequestClose={isMandatory ? null : handleSkip}
    >
      <View style={styles.overlay}>
        {/* Animated Background Particles */}
        <View style={styles.particlesContainer}>
          {[...Array(8)].map((_, i) => (
            <Animated.View 
              key={i} 
              style={[
                styles.particle, 
                { 
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  transform: [{ scale: pulseAnim }]
                }
              ]} 
            />
          ))}
        </View>

        <View style={styles.modal}>
          {/* Stunning Header with Gaming Design */}
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark, '#4C1D95']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientHeader}
          >
            {/* Decorative Gaming Elements */}
            <View style={styles.headerDecoration}>
              <View style={styles.decorativeLine} />
              <View style={styles.decorativeCircle} />
              <View style={styles.decorativeLine} />
            </View>

            {isMandatory && (
              <View style={styles.mandatoryBadge}>
                <LinearGradient
                  colors={[theme.colors.danger, '#DC2626']}
                  style={styles.mandatoryGradient}
                >
                  <Text style={styles.mandatoryText}>⚡ CRITICAL</Text>
                </LinearGradient>
              </View>
            )}
            
            <View style={styles.header}>
              {/* Gaming-style Animated Icon */}
              <Animated.View style={[styles.updateIconContainer, { transform: [{ scale: pulseAnim }] }]}>
                <View style={styles.updateIconGlow} />
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.3)', 'rgba(255, 255, 255, 0.1)']}
                  style={styles.updateIcon}
                >
                  <Text style={styles.updateIconText}>
                    {isMandatory ? '🚀' : '✨'}
                  </Text>
                </LinearGradient>
              </Animated.View>
              
              <Text style={styles.title}>
                {isMandatory ? 'CRITICAL UPDATE' : 'NEW VERSION AVAILABLE'}
              </Text>
              
              <View style={styles.versionContainer}>
                <Text style={styles.versionLabel}>VERSION</Text>
                <Text style={styles.version}>{updateInfo.version}</Text>
              </View>
              
              {updateInfo.fileSize && (
                <View style={styles.fileSizeContainer}>
                  <Text style={styles.fileSize}>
                    📦 {(updateInfo.fileSize / 1024 / 1024).toFixed(1)} MB
                  </Text>
                </View>
              )}
            </View>

            {/* Gaming Wave Effect */}
            <View style={styles.headerWave} />
          </LinearGradient>

          {/* Content Section with Gaming Style */}
          <View style={styles.content}>
            {/* Release Notes with Gaming Design */}
            <View style={styles.notesContainer}>
              <LinearGradient
                colors={[theme.colors.backgroundLight, theme.colors.backgroundCard]}
                style={styles.notesGradient}
              >
                <View style={styles.notesHeader}>
                  <Text style={styles.notesIcon}>🎮</Text>
                  <Text style={styles.notesTitle}>PATCH NOTES</Text>
                  <View style={styles.notesDivider} />
                </View>
                <Text style={styles.notes}>{updateInfo.notes}</Text>
                
                {/* Gaming-style feature highlights */}
                {updateInfo.features && (
                  <View style={styles.featureList}>
                    {updateInfo.features.map((feature, index) => (
                      <View key={index} style={styles.featureItem}>
                        <Text style={styles.featureIcon}>⚡</Text>
                        <Text style={styles.featureText}>{feature}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </LinearGradient>
            </View>
            
            {/* Gaming-style Error Display */}
            {error && (
              <View style={styles.errorContainer}>
                <LinearGradient
                  colors={['rgba(239, 68, 68, 0.15)', 'rgba(239, 68, 68, 0.05)']}
                  style={styles.errorGradient}
                >
                  <View style={styles.errorHeader}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={styles.errorTitle}>SYSTEM ERROR</Text>
                  </View>
                  <Text style={styles.errorText}>{error}</Text>
                  {retryCount < 3 && (
                    <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                      <LinearGradient
                        colors={[theme.colors.danger, '#DC2626']}
                        style={styles.retryGradient}
                      >
                        <Text style={styles.retryIcon}>🔄</Text>
                        <Text style={styles.retryButtonText}>
                          RETRY ({3 - retryCount} LEFT)
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </LinearGradient>
              </View>
            )}
            
            {/* Gaming-style Download Progress */}
            {downloading && !error && (
              <View style={styles.progressContainer}>
                <LinearGradient
                  colors={[theme.colors.backgroundLight, theme.colors.backgroundCard]}
                  style={styles.progressGradient}
                >
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressIcon}>⚡</Text>
                    <Text style={styles.progressText}>DOWNLOADING</Text>
                    <Text style={styles.progressPercentage}>{downloadProgress.toFixed(0)}%</Text>
                  </View>
                  
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBg} />
                    <LinearGradient
                      colors={[theme.colors.primary, theme.colors.accent, '#10B981']}
                      start={{x: 0, y: 0}}
                      end={{x: 1, y: 0}}
                      style={[styles.progressFill, { width: `${downloadProgress}%` }]}
                    />
                    <View style={[styles.progressGlow, { width: `${downloadProgress}%` }]} />
                  </View>
                  
                  <Text style={styles.progressSubtext}>
                    🎯 Keep app active for optimal performance
                  </Text>
                </LinearGradient>
              </View>
            )}

            {/* Gaming-style Permission Waiting */}
            {waitingForPermission && (
              <View style={styles.waitingContainer}>
                <LinearGradient
                  colors={[theme.colors.backgroundLight, theme.colors.backgroundCard]}
                  style={styles.waitingGradient}
                >
                  <View style={styles.waitingHeader}>
                    <Text style={styles.waitingIcon}>⏳</Text>
                    <Text style={styles.waitingTitle}>AWAITING PERMISSION</Text>
                  </View>
                  <Text style={styles.waitingText}>
                    🔐 Enable "Install from unknown sources" in settings, then return to continue the installation process.
                  </Text>
                </LinearGradient>
              </View>
            )}
          </View>

          {/* Gaming-style Action Buttons */}
          <View style={styles.buttons}>
            {!isMandatory && !downloading && !waitingForPermission && (
              <TouchableOpacity 
                style={[styles.button, styles.skipButton]} 
                onPress={handleSkip}
              >
                <LinearGradient
                  colors={[theme.colors.backgroundLight, theme.colors.backgroundCard]}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.skipIcon}>⏭️</Text>
                  <Text style={styles.skipButtonText}>SKIP</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity 
              style={[
                styles.button, 
                styles.updateButton,
                (!isMandatory && !downloading && !waitingForPermission) ? {} : { flex: 1 }
              ]} 
              onPress={handleUpdate}
              disabled={downloading && !error}
            >
              <LinearGradient
                colors={downloading && !error 
                  ? ['rgba(99, 102, 241, 0.6)', 'rgba(79, 70, 229, 0.6)']
                  : [theme.colors.primary, theme.colors.primaryDark, '#4C1D95']
                }
                style={styles.buttonGradient}
              >
                {downloading && !error ? (
                  <>
                    <ActivityIndicator color="#FFFFFF" size="small" />
                    <Text style={styles.updateButtonText}>DOWNLOADING...</Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.updateIcon}>
                      {waitingForPermission ? '⏳' : '🚀'}
                    </Text>
                    <Text style={styles.updateButtonText}>
                      {waitingForPermission ? 'WAITING...' : 'UPDATE NOW'}
                    </Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.98)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
  },
  modal: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  gradientHeader: {
    padding: 32,
    paddingBottom: 24,
    position: 'relative',
  },
  headerDecoration: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  decorativeLine: {
    height: 2,
    width: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  decorativeCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 12,
  },
  mandatoryBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mandatoryGradient: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mandatoryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  header: {
    alignItems: 'center',
  },
  updateIconContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  updateIconGlow: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    top: -8,
    left: -8,
  },
  updateIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  updateIconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 1,
  },
  versionContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  versionLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
    letterSpacing: 2,
  },
  version: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '700',
    marginTop: 2,
  },
  fileSizeContainer: {
    marginTop: 8,
  },
  fileSize: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  headerWave: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: theme.colors.backgroundCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    padding: 24,
    paddingTop: 16,
  },
  notesContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  notesGradient: {
    padding: 20,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  notesIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    letterSpacing: 1,
    flex: 1,
  },
  notesDivider: {
    height: 2,
    width: 30,
    backgroundColor: theme.colors.accent,
  },
  notes: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  featureList: {
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureIcon: {
    fontSize: 16,
    marginRight: 12,
    width: 20,
  },
  featureText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    flex: 1,
    lineHeight: 20,
  },
  errorContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  errorGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  errorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  errorIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.danger,
    letterSpacing: 0.5,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.textDanger,
    lineHeight: 20,
    marginBottom: 16,
  },
  retryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  retryGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  retryIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  progressGradient: {
    padding: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  progressText: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '700',
    flex: 1,
    letterSpacing: 0.5,
  },
  progressPercentage: {
    fontSize: 20,
    color: theme.colors.primary,
    fontWeight: '800',
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: theme.colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  progressBarBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.border,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: 0,
    height: 16,
    backgroundColor: theme.colors.primary,
    opacity: 0.3,
    borderRadius: 8,
  },
  progressSubtext: {
    fontSize: 13,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  waitingContainer: {
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  waitingGradient: {
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.accent,
  },
  waitingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  waitingIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  waitingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.accent,
    letterSpacing: 0.5,
  },
  waitingText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    padding: 24,
    paddingTop: 0,
    gap: 16,
  },
  button: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 24,
  },
  skipButton: {
    elevation: 2,
  },
  skipIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  skipButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  updateButton: {
    elevation: 8,
  },
  updateIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default UpdateChecker;