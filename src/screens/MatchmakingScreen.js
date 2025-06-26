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
import io from 'socket.io-client';
import config from '../config/config';

const MatchmakingScreen = ({navigation, route}) => {
  const {game, playerCount, entryFee} = route.params;
  const {token} = useAuth();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('connecting');
  const [playersFound, setPlayersFound] = useState(0);
  const [waitTime, setWaitTime] = useState(0);
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    connectSocket();
    const timerCleanup = startWaitTimer();
    startPulseAnimation();

    // Handle Android back button
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default behavior
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
      if (timerCleanup) {
        timerCleanup();
      }
      backHandler.remove();
    };
  }, []);

  const handleBackPress = () => {
    Alert.alert(
      'Cancel Matchmaking',
      'Are you sure you want to cancel? Your entry fee will be refunded.',
      [
        {text: 'No', style: 'cancel'},
        {text: 'Yes', onPress: leaveMatchmaking, style: 'destructive'},
      ]
    );
  };

  const connectSocket = () => {
    const socketConnection = io(config.SERVER_URL, {
      auth: {
        token: token,
      },
    });

    socketConnection.on('connect', () => {
      console.log('Connected to matchmaking');
      setStatus('searching');
      joinMatchmaking();
    });

    socketConnection.on('matchmakingStatus', (data) => {
      console.log('Matchmaking status:', data);
      if (data.status === 'waiting') {
        setStatus('searching');
      }
    });

    socketConnection.on('matchFound', (data) => {
      console.log('Match found:', data);
      setStatus('found');
      Alert.alert(
        'Match Found!',
        'A game has been found. Joining now...',
        [
          {
            text: 'OK',
            onPress: () => {
              // Route to appropriate game screen based on game type
              if (game.id === 'memory') {
                navigation.navigate('MemoryGame', {
                  roomId: data.game.id,
                  playerId: data.playerId || 'player1',
                  playerName: data.playerName || 'Player',
                  socket: socketConnection,
                });
              } else if (game.id === 'fast_ludo') {
                navigation.navigate('FastLudoGame', {
                  gameId: data.game.id,
                  playerId: data.playerId || 'player1',
                  playerName: data.playerName || 'Player',
                  socket: socketConnection,
                });
              } else {
                navigation.navigate('Game', {
                  gameId: data.game.id,
                  game: data.game,
                });
              }
            },
          },
        ]
      );
    });

    socketConnection.on('error', (error) => {
      console.error('Matchmaking error:', error);
      Alert.alert('Error', error.message, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    });

    socketConnection.on('disconnect', () => {
      console.log('Disconnected from matchmaking');
      if (status !== 'found') {
        setStatus('disconnected');
      }
    });

    setSocket(socketConnection);
  };

  const joinMatchmaking = () => {
    if (socket) {
      const gameType = game.id === 'memory' ? 'MEMORY' : 
                      game.id === 'fast_ludo' ? 'FAST_LUDO' :  'LUDO';
      
      socket.emit('joinMatchmaking', {
        gameType: gameType,
        maxPlayers: playerCount,
        entryFee: entryFee,
      });
    }
  };

  const leaveMatchmaking = () => {
    if (socket) {
      socket.emit('leaveMatchmaking');
      setTimeout(() => {
        socket.disconnect();
      }, 100);
    }
    navigation.navigate('Home');
  };

  const startWaitTimer = () => {
    const interval = setInterval(() => {
      setWaitTime((prev) => prev + 1);
    }, 1000);

    // Auto-cancel after 1 minutes
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (status === 'searching') {
        Alert.alert(
          'Matchmaking Timeout',
          'Unable to find players. Your entry fee will be refunded.',
          [
            {
              text: 'OK',
              onPress: () => {
                leaveMatchmaking();
              },
            },
          ]
        );
      }
    }, 60000); // 1 min

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
        if (status === 'searching') {
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
    switch (status) {
      case 'connecting':
        return 'Connecting to matchmaking...';
      case 'searching':
        return 'Searching for players...';
      case 'found':
        return 'Match found! Joining game...';
      case 'disconnected':
        return 'Connection lost. Please try again.';
      default:
        return 'Preparing matchmaking...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connecting':
        return '#f39c12';
      case 'searching':
        return '#3498db';
      case 'found':
        return '#27ae60';
      case 'disconnected':
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
        
        {status === 'searching' && (
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
});

export default MatchmakingScreen;