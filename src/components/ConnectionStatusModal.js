import React, { useEffect, useState } from 'react';
import { View, Text, Modal, StyleSheet, Animated, Dimensions } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../styles/theme';
import config from '../config/config';

const { width: screenWidth } = Dimensions.get('window');

const ConnectionStatusModal = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [serverStatus, setServerStatus] = useState('online');
  const [showModal, setShowModal] = useState(false);
  const [connectionType, setConnectionType] = useState('internet'); // 'internet' or 'server'
  const [pulseAnim] = useState(new Animated.Value(1));
  const [isChecking, setIsChecking] = useState(false);
  
  // Only log when modal state actually changes
  React.useEffect(() => {
    console.log('ConnectionStatusModal state changed:', { showModal, isConnected, serverStatus, connectionType });
  }, [showModal, isConnected, serverStatus, connectionType]);

  useEffect(() => {
    // For testing - uncomment to force show modal
    // setShowModal(true);
    // setConnectionType('server');
    // setServerStatus('offline');
    // setIsConnected(true);
    
    // Initial check after a short delay
    const initialCheck = setTimeout(() => {
      checkConnectivity();
    }, 3000); // Increased delay to prevent immediate checks

    // Pulse animation
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

    return () => {
      clearTimeout(initialCheck);
      pulseAnimation.stop();
    };
  }, []);

  const checkConnectivity = async () => {
    if (isChecking) {
      console.log('🔍 Connectivity check already in progress, skipping...');
      return;
    }
    
    setIsChecking(true);
    console.log('🔍 Checking connectivity...');
    
    // Check internet first
    let hasInternet = false;
    try {
      const response = await Promise.race([
        fetch('https://www.google.com', { method: 'HEAD' }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Internet timeout')), 5000))
      ]);
      hasInternet = response.ok;
      console.log('✅ Internet connection OK');
    } catch (error) {
      console.log('❌ No internet connection:', error.message);
      setIsConnected(false);
      setServerStatus('offline');
      setConnectionType('internet');
      setShowModal(true);
      setIsChecking(false);
      return;
    }
    
    // Check server if internet is working
    if (hasInternet) {
      try {
        const response = await Promise.race([
          fetch(`${config.SERVER_URL}/health`),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Server timeout')), 8000))
        ]);
        
        if (response.ok) {
          console.log('✅ Server connection OK');
          setIsConnected(true);
          setServerStatus('online');
          setShowModal(false);
          setIsChecking(false);
        } else {
          throw new Error('Server returned error');
        }
      } catch (error) {
        console.log('❌ Server connection failed:', error.message);
        console.log('🚨 Setting modal to show - server down');
        setIsConnected(true);
        setServerStatus('offline');
        setConnectionType('server');
        setShowModal(true);
        setIsChecking(false);
      }
    }

  };

  if (!showModal) {
    return null;
  }

  const isInternetIssue = connectionType === 'internet';
  const title = isInternetIssue ? 'NO INTERNET CONNECTION' : 'SERVER UNAVAILABLE';
  const message = isInternetIssue 
    ? 'Please check your internet connection and try again.'
    : 'Our servers are temporarily unavailable. Please try after some time.';
  const icon = isInternetIssue ? '📶' : '🔧';

  return (
    <Modal
      visible={showModal}
      transparent={true}
      animationType="fade"
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <LinearGradient
            colors={[theme.colors.danger, '#DC2626', '#B91C1C']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.gradientHeader}
          >
            <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.icon}>{icon}</Text>
            </Animated.View>
            
            <Text style={styles.title}>{title}</Text>
          </LinearGradient>

          <View style={styles.content}>
            <Text style={styles.message}>{message}</Text>
            
            <View style={styles.statusContainer}>
              <View style={styles.statusItem}>
                <Text style={styles.statusIcon}>📶</Text>
                <Text style={styles.statusLabel}>Internet</Text>
                <View style={[styles.statusDot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.danger }]} />
              </View>
              
              <View style={styles.statusItem}>
                <Text style={styles.statusIcon}>🔧</Text>
                <Text style={styles.statusLabel}>Server</Text>
                <View style={[styles.statusDot, { backgroundColor: serverStatus === 'online' ? theme.colors.success : theme.colors.danger }]} />
              </View>
            </View>
            

          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: theme.colors.backgroundCard,
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: theme.colors.danger,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.danger,
  },
  gradientHeader: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
  content: {
    padding: 24,
  },
  message: {
    fontSize: 15,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontWeight: '600',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },

});

export default ConnectionStatusModal;