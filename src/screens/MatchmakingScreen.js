import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  BackHandler,
  Modal,
  Dimensions,
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useGame} from '../context/GameContext';

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
    clearError
  } = useGame();
  
  const [playersFound, setPlayersFound] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [countdown, setCountdown] = useState(null);
  const [showMatchFoundModal, setShowMatchFoundModal] = useState(false);
  const [modalAnimation] = useState(new Animated.Value(0));
  const [countdownPulse] = useState(new Animated.Value(1));

  useEffect(() => {
    // Start matchmaking when component mounts and socket is connected
    if (connectionStatus === 'connected' && matchmakingStatus === 'idle') {
      console.log('🎯 Starting matchmaking - connection ready and status idle');
      startMatchmaking();
    }
    
    const timerCleanup = startWaitTimer();
    startPulseAnimation();

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default behavior
    });

    return () => {
      if (timerCleanup) {
        timerCleanup();
      }
      backHandler.remove();
    };
  }, [connectionStatus, matchmakingStatus]); // Add matchmakingStatus to dependencies

  // Handle matchmaking status changes
  useEffect(() => {
    console.log('🔍 Matchmaking status changed:', matchmakingStatus, 'GameId:', gameId);
    if (matchmakingStatus === 'found' && gameId) {
      console.log('✅ Match found detected, handling...');
      handleMatchFound();
    }
  }, [matchmakingStatus, gameId]);

  // Also listen for direct gameId changes (in case status doesn't update properly)
  useEffect(() => {
    if (gameId && matchmakingStatus !== 'idle') {
      console.log('🎮 GameId received:', gameId, 'Status:', matchmakingStatus);
      if (!showMatchFoundModal) {
        console.log('✅ Triggering match found from gameId change');
        handleMatchFound();
      }
    }
  }, [gameId]);

  // Handle errors
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
    const gameType = game.id === 'memory' ? 'MEMORY' : 
                    game.id === 'fast_ludo' ? 'FAST_LUDO' : 
                    game.id === 'snakes_ladders' ? 'SNAKES_LADDERS' :
                    game.id === 'classic_ludo' ? 'CLASSIC_LUDO' : 'CLASSIC_LUDO';
    
    console.log('Starting matchmaking for:', gameType, playerCount, entryFee);
    joinMatchmaking(gameType, playerCount, entryFee);
  };

  const handleMatchFound = () => {
    console.log('Match found! GameId:', gameId, 'PlayerId:', playerId || user?.id);
    
    // Show match found modal with animation
    setShowMatchFoundModal(true);
    
    // Animate modal entrance
    Animated.spring(modalAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
    
    // Start countdown pulse animation
    const startCountdownPulse = () => {
      Animated.sequence([
        Animated.timing(countdownPulse, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(countdownPulse, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (countdown > 0) {
          startCountdownPulse();
        }
      });
    };
    
    // Start 5-second countdown
    let countdownValue = 5;
    setCountdown(countdownValue);
    startCountdownPulse();

    const countdownInterval = setInterval(() => {
      countdownValue--;
      setCountdown(countdownValue);
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        // Animate modal exit
        Animated.timing(modalAnimation, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          setShowMatchFoundModal(false);
          redirectToGame();
        });
      }
    }, 1000);
  };

  const redirectToGame = () => {
    const playerIdToUse = playerId || user?.id;
    const playerNameToUse = user?.name || user?.phoneNumber || 'Player';
    
    console.log('🎮 Redirecting to game:', {
      gameType: game.id,
      gameId: gameId,
      playerId: playerIdToUse,
      playerName: playerNameToUse,
      userFromAuth: user,
      playersFromGame: players
    });
    
    // Route to appropriate game screen based on game type
    if (game.id === 'memory') {
      navigation.navigate('MemoryGame', {
        roomId: gameId,
        playerId: playerIdToUse,
        playerName: playerNameToUse,
        socket: socket,
        players: players, // Pass matched players data
      });
    } else if (game.id === 'fast_ludo') {
      navigation.navigate('FastLudoGame', {
        gameId: gameId,
        playerId: playerIdToUse,
        playerName: playerNameToUse,
        socket: socket,
        players: players, // Pass matched players data
      });
    } else if (game.id === 'snakes_ladders') {
      navigation.navigate('SnakesLaddersGame', {
        gameId: gameId,
        playerId: playerIdToUse,
        playerName: playerNameToUse,
        socket: socket,
        players: players, // Pass matched players data
      });
    } else if (game.id === 'classic_ludo') {
      navigation.navigate('Game', {
        gameId: gameId,
        playerId: playerIdToUse,
        playerName: playerNameToUse,
        socket: socket,
        game: game,
        players: players, // Pass matched players data
      });
    }
  };

  const handleLeaveMatchmaking = () => {
    leaveMatchmaking();
    navigation.navigate('Home');
  };

  const startWaitTimer = () => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    // Auto-cancel after 2 minutes for testing
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
    }, 120000); // 2 minutes

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  };

  const startPulseAnimation = () => {
    const pulse = () => {
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
      ]).start(() => {
        if (matchmakingStatus === 'searching') {
          pulse();
        }
      });
    };
    pulse();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusMessage = () => {
    if (connectionStatus === 'connecting') {
      return 'Connecting to matchmaking...';
    }
    if (connectionStatus === 'disconnected') {
      return 'Connection lost. Please try again.';
    }
    
    switch (matchmakingStatus) {
      case 'idle':
        return 'Preparing matchmaking...';
      case 'searching':
        return 'Searching for players...';
      case 'found':
        return 'Match found! Joining game...';
      case 'error':
        return 'Error occurred. Please try again.';
      default:
        return 'Preparing matchmaking...';
    }
  };

  const getStatusColor = () => {
    if (connectionStatus === 'connecting') {
      return '#f39c12';
    }
    if (connectionStatus === 'disconnected') {
      return '#e74c3c';
    }
    
    switch (matchmakingStatus) {
      case 'idle':
        return '#95a5a6';
      case 'searching':
        return '#3498db';
      case 'found':
        return '#27ae60';
      case 'error':
        return '#e74c3c';
      default:
        return '#95a5a6';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Finding Players</Text>
        <Text style={styles.subtitle}>
          {game.name} • {playerCount} Players • ₹{entryFee}
        </Text>
      </View>

      {/* Matchmaking Animation */}
      <View style={styles.animationContainer}>
        <Animated.View
          style={[
            styles.pulseCircle,
            {
              transform: [{scale: pulseAnim}],
              backgroundColor: getStatusColor(),
            },
          ]}>
          <Text style={styles.gameIcon}>{game.image}</Text>
        </Animated.View>
        
        <Text style={[styles.statusText, {color: getStatusColor()}]}>
          {getStatusMessage()}
        </Text>
        
        {(matchmakingStatus === 'searching' || connectionStatus === 'connecting') && (
          <ActivityIndicator
            size="large"
            color={getStatusColor()}
            style={styles.loader}
          />
        )}
      </View>

      {/* Match Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Wait Time:</Text>
            <Text style={styles.infoValue}>{formatTime(waitTime)}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Players Found:</Text>
            <Text style={styles.infoValue}>
              {playersFound}/{playerCount}
            </Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Entry Fee:</Text>
            <Text style={styles.infoValue}>₹{entryFee}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Prize Pool:</Text>
            <Text style={[styles.infoValue, styles.prizeValue]}>
              ₹{(entryFee * playerCount * 0.9).toFixed(0)}
            </Text>
          </View>

                  </View>
      </View>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>💡 While you wait...</Text>
        <Text style={styles.tipsText}>
          • Keep the app open for faster matchmaking{'\n'}
          • Check your internet connection{'\n'}
          • Entry fee is already deducted{'\n'}
          • You'll get a refund if no match is found
        </Text>
      </View>

      {/* Cancel Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleBackPress}>
          <Text style={styles.cancelButtonText}>Cancel & Refund</Text>
        </TouchableOpacity>
      </View>

      {/* Match Found Modal */}
      <Modal
        visible={showMatchFoundModal}
        transparent={true}
        animationType="none"
        onRequestClose={() => {}} // Prevent closing
      >
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    scale: modalAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
                opacity: modalAnimation,
              },
            ]}
          >
            {/* Success Icon */}
            <View style={styles.successIconContainer}>
              <Text style={styles.successIcon}>🎉</Text>
            </View>
            
            {/* Match Found Text */}
            <Text style={styles.modalTitle}>Match Found!</Text>
            <Text style={styles.modalSubtitle}>
              {playerCount} players ready to play {game.name}
            </Text>
            
            {/* Countdown Circle */}
            <Animated.View 
              style={[
                styles.countdownCircle,
                {
                  transform: [{ scale: countdownPulse }]
                }
              ]}
            >
              <Text style={styles.countdownNumber}>{countdown}</Text>
            </Animated.View>
            
            {/* Starting Text */}
            <Text style={styles.startingText}>
              Game starting in {countdown} second{countdown !== 1 ? 's' : ''}...
            </Text>
            
            {/* Game Info */}
            <View style={styles.modalGameInfo}>
              <Text style={styles.modalGameText}>
                🎮 {game.name} • 👥 {playerCount} Players • 💰 ₹{entryFee}
              </Text>
              <Text style={styles.modalPrizeText}>
                Prize Pool: ₹{(entryFee * playerCount * 0.9).toFixed(0)}
              </Text>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#ffffff',
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  animationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  pulseCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  gameIcon: {
    fontSize: 48,
    color: '#ffffff',
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  loader: {
    marginTop: 10,
  },
  infoContainer: {
    padding: 20,
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
  },
  prizeValue: {
    color: '#27ae60',
  },
  tipsContainer: {
    margin: 20,
    backgroundColor: '#e8f4fd',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#3498db',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2980b9',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#2980b9',
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 20,
  },
  cancelButton: {
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    minWidth: Dimensions.get('window').width * 0.8,
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successIcon: {
    fontSize: 60,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    marginBottom: 30,
    textAlign: 'center',
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#27ae60',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#27ae60',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  countdownNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  startingText: {
    fontSize: 18,
    color: '#2c3e50',
    marginBottom: 25,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalGameInfo: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ecf0f1',
    width: '100%',
  },
  modalGameText: {
    fontSize: 16,
    color: '#34495e',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalPrizeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#27ae60',
    textAlign: 'center',
  },
});

export default MatchmakingScreen;