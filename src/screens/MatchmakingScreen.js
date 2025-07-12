import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  BackHandler,
  Modal,
  Dimensions,
  SafeAreaView,
  Animated,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useGame} from '../context/GameContext';
import { theme, commonStyles } from '../styles/theme';
import GradientBackground from '../components/GradientBackground';

const { width } = Dimensions.get('window');

const MatchmakingScreen = ({navigation, route}) => {
  const {game, playerCount, entryFee} = route.params;
  const {user} = useAuth();
  const {
    socket,
    connectionStatus,
    matchmakingStatus,
    gameId,
    playerId,
    players,
    error,
    joinMatchmaking,
    leaveMatchmaking,
    clearError,
    resetToIdle
  } = useGame();
  
  const [playersFound, setPlayersFound] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const [showMatchFoundModal, setShowMatchFoundModal] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  
  // Add state to prevent multiple matchmaking attempts
  const [hasStartedMatchmaking, setHasStartedMatchmaking] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only reset once when component mounts
    if (!hasInitialized.current) {
      resetToIdle();
      hasInitialized.current = true;
    }
  }, []);

  useEffect(() => {
    // Only start matchmaking once when connected and not already started
    if (connectionStatus === 'connected' && 
        !hasStartedMatchmaking && 
        !isJoining && 
        matchmakingStatus === 'idle') {
      
      console.log('🎯 Starting matchmaking process...');
      setIsJoining(true);
      
      // Small delay to ensure connection is stable
      setTimeout(() => {
        startMatchmaking();
        setHasStartedMatchmaking(true);
        setIsJoining(false);
      }, 500);
    }
    
    const timerCleanup = startWaitTimer();
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => {
      if (timerCleanup) {
        timerCleanup();
      }
      backHandler.remove();
    };
  }, [connectionStatus, hasStartedMatchmaking, isJoining, matchmakingStatus]);

  useEffect(() => {
    if (matchmakingStatus === 'found' && gameId) {
      handleMatchFound();
    }
  }, [matchmakingStatus, gameId]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error, [
        {
          text: 'OK',
          onPress: () => {
            clearError();
            navigation.navigate('Home');
          },
        },
      ]);
    }
  }, [error]);

  const handleBackPress = () => {
    Alert.alert(
      'Cancel Matchmaking',
      'Are you sure you want to cancel? Your entry fee will be refunded.',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', onPress: handleLeaveMatchmaking, style: 'destructive'},
      ]
    );
  };

  const startMatchmaking = () => {
    // Prevent multiple calls
    if (hasStartedMatchmaking || isJoining) {
      console.log('🔄 Matchmaking already started or in progress');
      return;
    }
    
    console.log('🚀 Initiating matchmaking for:', { 
      gameType: 'MEMORY', 
      playerCount, 
      entryFee 
    });
    
    const gameType = 'MEMORY';
    joinMatchmaking(gameType, playerCount, entryFee);
  };

  const handleMatchFound = () => {
    setShowMatchFoundModal(true);
    let countdownValue = 5;
    setCountdown(countdownValue);

    const countdownInterval = setInterval(() => {
      countdownValue--;
      setCountdown(countdownValue);
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        setShowMatchFoundModal(false);
        redirectToGame();
      }
    }, 1000);
  };

  const redirectToGame = () => {
    const playerIdToUse = playerId || user?.id;
    const playerNameToUse = user?.name || user?.phoneNumber || 'Player';
    
    navigation.navigate('MemoryGame', {
      roomId: gameId,
      playerId: playerIdToUse,
      playerName: playerNameToUse,
      socket: socket,
      players: players,
    });
  };

  const handleLeaveMatchmaking = () => {
    leaveMatchmaking();
    navigation.navigate('Home');
  };

  const startWaitTimer = () => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (matchmakingStatus === 'searching') {
        Alert.alert(
          'Matchmaking Timeout',
          'Unable to find players. Your entry fee will be refunded.',
          [
            {
              text: 'OK',
              onPress: () => {
                handleLeaveMatchmaking();
              },
            },
          ]
        );
      }
    }, 120000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    if (connectionStatus === 'connecting') {
      return 'Connecting to battle arena...';
    }
    if (connectionStatus === 'disconnected') {
      return 'Connection lost. Please try again.';
    }
    
    switch (matchmakingStatus) {
      case 'idle':
        return isJoining ? 'Preparing for battle...' : 'Ready to start...';
      case 'searching':
        return 'Searching for worthy opponents...';
      case 'found':
        return 'Match found! Entering battle...';
      case 'error':
        return 'Error occurred. Please try again.';
      default:
        return 'Preparing for battle...';
    }
  };

  const getStatusColor = () => {
    if (connectionStatus === 'connecting') return theme.colors.warning;
    if (connectionStatus === 'disconnected') return theme.colors.danger;
    
    switch (matchmakingStatus) {
      case 'idle': return theme.colors.textSecondary;
      case 'searching': return theme.colors.primary;
      case 'found': return theme.colors.success;
      case 'error': return theme.colors.danger;
      default: return theme.colors.textSecondary;
    }
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        {/* Header - Compact */}
        <View style={styles.header}>
          <Text style={styles.title}>🔍 Finding Players</Text>
          <Text style={styles.subtitle}>
            {game.name} • {playerCount} Players • ₹{entryFee}
          </Text>
        </View>

        {/* Status Section - Main Focus */}
        <View style={styles.statusSection}>
          <View style={[styles.statusIcon, { backgroundColor: getStatusColor() }]}>
            <Text style={styles.gameIcon}>{game.emoji}</Text>
          </View>
          
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusMessage()}
          </Text>
          
          {(matchmakingStatus === 'searching' || connectionStatus === 'connecting' || isJoining) && (
            <ActivityIndicator
              size="large"
              color={getStatusColor()}
              style={styles.loader}
            />
          )}
        </View>

        {/* Info Grid - Compact */}
        <View style={styles.infoSection}>
          <View style={styles.infoGrid}>
            <Animated.View style={[styles.infoCard, styles.highlightedTimerCard, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <Text style={[styles.infoValue, styles.highlightedTimerValue]}>{formatTime(waitTime)}</Text>
              <Text style={[styles.infoLabel, styles.highlightedTimerLabel]}>Wait Time</Text>
            </Animated.View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>👥</Text>
              <Text style={styles.infoValue}>{playerCount}</Text>
              <Text style={styles.infoLabel}>Players</Text>
            </View>
            
            <View style={styles.infoCard}>
              <Text style={styles.infoIcon}>🏆</Text>
              <Text style={[styles.infoValue, styles.prizeValue]}>
                ₹{(entryFee * playerCount * 0.8).toFixed(0)}
              </Text>
              <Text style={styles.infoLabel}>Prize Pool</Text>
            </View>
          </View>
        </View>

        {/* Tips - Compact */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 While You Wait</Text>
            <Text style={styles.tipsText}>
              Keep app open • Entry fee deducted once • Refund if no match in 2 min
            </Text>
          </View>
        </View>

        {/* Cancel Button - Bottom */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleBackPress}
            disabled={isJoining}>
            <Text style={styles.cancelButtonText}>
              🚫 Cancel & Get Refund
            </Text>
          </TouchableOpacity>
        </View>

        {/* Match Found Modal */}
        <Modal
          visible={showMatchFoundModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.successIcon}>🎉</Text>
              <Text style={styles.modalTitle}>Match Found!</Text>
              <Text style={styles.modalSubtitle}>
                {playerCount} players ready for battle
              </Text>
              
              <View style={styles.countdownCircle}>
                <Text style={styles.countdownNumber}>{countdown}</Text>
              </View>
              
              <Text style={styles.startingText}>
                Starting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </Text>
              
              <Text style={styles.modalPrizeText}>
                🏆 Prize: ₹{(entryFee * playerCount * 0.8).toFixed(0)}
              </Text>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  
  statusSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  statusIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
    ...theme.shadows.large,
  },
  gameIcon: {
    fontSize: 48,
    color: theme.colors.textPrimary,
  },
  statusText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
  },
  loader: {
    marginTop: theme.spacing.md,
  },
  
  infoSection: {
    paddingVertical: theme.spacing.lg,
  },
  infoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  infoCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    minWidth: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  highlightedTimerCard: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.accent,
    borderWidth: 2,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  highlightedTimerValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.lg,
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightedTimerLabel: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  infoIcon: {
    fontSize: 20,
    marginBottom: theme.spacing.sm,
  },
  infoValue: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  prizeValue: {
    color: theme.colors.accent,
  },
  infoLabel: {
    fontSize: theme.fonts.sizes.xs,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  
  tipsSection: {
    paddingVertical: theme.spacing.lg,
  },
  tipsCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.info,
  },
  tipsTitle: {
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  tipsText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  
  buttonSection: {
    paddingBottom: theme.spacing.lg,
  },
  cancelButton: {
    backgroundColor: theme.colors.danger,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  cancelButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  modalContainer: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.success,
    width: '90%',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: theme.spacing.lg,
  },
  modalTitle: {
    fontSize: theme.fonts.sizes.xxl,
    fontWeight: 'bold',
    color: theme.colors.textSuccess,
    marginBottom: theme.spacing.sm,
  },
  modalSubtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xl,
    textAlign: 'center',
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 3,
    borderColor: theme.colors.textPrimary,
  },
  countdownNumber: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  startingText: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    fontWeight: 'bold',
  },
  modalPrizeText: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.accent,
  },
});

export default MatchmakingScreen;