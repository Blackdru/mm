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
} from 'react-native';
import {useAuth} from '../context/AuthContext';
import {useGame} from '../context/GameContext';

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
  const [showCountdown, setShowCountdown] = useState(false);

  useEffect(() => {
    // Start matchmaking when component mounts and socket is connected
    if (connectionStatus === 'connected' && matchmakingStatus === 'idle') {
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
  }, [connectionStatus]);

  // Handle matchmaking status changes
  useEffect(() => {
    if (matchmakingStatus === 'found' && gameId) {
      handleMatchFound();
    }
  }, [matchmakingStatus, gameId]);

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
                    game.id === 'classic_ludo' ? 'CLASSIC_LUDO' : 'CLASSIC_LUDO';
    
    console.log('Starting matchmaking for:', gameType, playerCount, entryFee);
    joinMatchmaking(gameType, playerCount, entryFee);
  };

  const handleMatchFound = () => {
    console.log('Match found! GameId:', gameId, 'PlayerId:', playerId || user?.id);
    setShowCountdown(true);
    let countdownValue = 5;
    setCountdown(countdownValue);

    const countdownInterval = setInterval(() => {
      countdownValue--;
      setCountdown(countdownValue);
      
      if (countdownValue <= 0) {
        clearInterval(countdownInterval);
        redirectToGame();
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
        
        {showCountdown && countdown !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownTitle}>Match Found!</Text>
            <Text style={styles.countdownText}>Game starts in {countdown} seconds</Text>
          </View>
        )}
        
        {(matchmakingStatus === 'searching' || connectionStatus === 'connecting') && !showCountdown && (
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
  countdownContainer: {
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#27ae60',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
  },
  countdownTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  countdownText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});

export default MatchmakingScreen;