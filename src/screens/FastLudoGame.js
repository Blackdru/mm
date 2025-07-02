import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import LudoBoard from '../components/LudoBoard';
import { useGame } from '../context/GameContext';

const { width, height } = Dimensions.get('window');

const FastLudoGameScreen = ({ route, navigation }) => {
  const { gameId, playerId, playerName, socket } = route.params;
  const { cleanupAfterGameEnd } = useGame();
  
  const [gameState, setGameState] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [diceValue, setDiceValue] = useState(null);
  const [canRollDice, setCanRollDice] = useState(false);
  const [scores, setScores] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [players, setPlayers] = useState([]);

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('FAST_LUDO_GAME_STARTED', handleGameStarted);
    socket.on('FAST_LUDO_TURN_UPDATE', handleTurnUpdate);
    socket.on('FAST_LUDO_DICE_ROLLED', handleDiceRolled);
    socket.on('FAST_LUDO_PIECE_MOVED', handlePieceMoved);
    socket.on('FAST_LUDO_GAME_ENDED', handleGameEnded);
    socket.on('FAST_LUDO_ERROR', handleError);

    return () => {
      console.log('🧹 FastLudoGame component unmounting, cleaning up...');
      
      // Emit leave game event
      if (socket && socket.connected) {
        socket.emit('LEAVE_FAST_LUDO_GAME', {
          gameId,
          playerId,
        });
      }
      
      socket.off('FAST_LUDO_GAME_STARTED');
      socket.off('FAST_LUDO_TURN_UPDATE');
      socket.off('FAST_LUDO_DICE_ROLLED');
      socket.off('FAST_LUDO_PIECE_MOVED');
      socket.off('FAST_LUDO_GAME_ENDED');
      socket.off('FAST_LUDO_ERROR');
      
      // Clean up game state but preserve matchmaking queue
      cleanupAfterGameEnd();
    };
  }, [socket, gameId, playerId, cleanupAfterGameEnd]);

  const handleGameStarted = (data) => {
    console.log('Fast Ludo game started:', data);
    setGameState(data.gameBoard);
    setPlayers(data.players);
    setTimeRemaining(data.timerDuration / 1000);
    startTimer(data.endTime);
  };

  const handleTurnUpdate = (data) => {
    setCurrentTurn(data.currentTurn);
    setCanRollDice(data.currentPlayer === playerId);
    setDiceValue(null);
  };

  const handleDiceRolled = (data) => {
    setDiceValue(data.diceValue);
    setCanRollDice(false);
  };

  const handlePieceMoved = (data) => {
    setGameState(data.gameBoard);
    setScores(data.scores);
    setCurrentTurn(data.nextTurn);
    setCanRollDice(data.nextPlayer === playerId);
    setDiceValue(null);
  };

  const handleGameEnded = (data) => {
    const winnerPlayer = players.find(p => p.id === data.winner);
    const winnerName = winnerPlayer?.name || winnerPlayer?.playerName || 'Unknown';
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nReason: ${data.reason === 'timer' ? 'Time Up!' : 'All tokens finished'}\n\nFinal Scores:\n${Object.keys(data.finalScores || {}).map(pid => {
        const player = players.find(p => p.id === pid);
        const pName = player?.name || player?.playerName || pid;
        return `${pName}: ${data.finalScores[pid]} points`;
      }).join('\n')}`,
      [
        { 
          text: 'Back to Menu', 
          onPress: () => {
            // Reset matchmaking state to idle for next game
            cleanupAfterGameEnd();
            navigation.navigate('Home');
          }
        }
      ]
    );
  };

  const handleError = (data) => {
    Alert.alert('Error', data.message);
  };

  const startTimer = (endTime) => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);
  };

  const rollDice = () => {
    if (canRollDice && socket) {
      socket.emit('ROLL_FAST_LUDO_DICE', {
        gameId,
        playerId
      });
    }
  };

  const movePiece = (pieceId) => {
    if (diceValue && socket) {
      socket.emit('MOVE_FAST_LUDO_PIECE', {
        gameId,
        playerId,
        pieceId
      });
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentPlayerName = () => {
    if (!players || players.length === 0 || !players[currentTurn]) return 'Unknown';
    return players[currentTurn].name || players[currentTurn].playerName || 'Unknown';
  };

  const getMyColor = () => {
    if (!gameState || !players) return null;
    const playerIndex = players.findIndex(p => p.id === playerId);
    const colors = ['red', 'blue', 'green', 'yellow'];
    return colors[playerIndex];
  };

  const getMyScore = () => {
    return scores[playerId] || 0;
  };

  if (!gameState) {
    return (
      <View style={styles.container}>
        <Text style={styles.waitingText}>Starting Fast Ludo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>⚡ Fast Ludo</Text>
        <Text style={styles.timer}>⏰ {formatTime(timeRemaining)}</Text>
      </View>

      {/* Scores */}
      <View style={styles.scoresContainer}>
        <Text style={styles.scoresTitle}>Scores</Text>
        <View style={styles.scoresRow}>
          {players.map((player, index) => (
            <View key={player.id} style={styles.scoreItem}>
              <Text style={styles.playerName}>{player.name || player.playerName || `Player ${index + 1}`}</Text>
              <Text style={styles.playerScore}>{scores[player.id] || 0}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Turn Info */}
      <View style={[
        styles.turnContainer,
        canRollDice && styles.myTurnContainer
      ]}>
        <Text style={[
          styles.turnText,
          canRollDice && styles.myTurnText
        ]}>
          {canRollDice ? "🎯 YOUR TURN!" : `${getCurrentPlayerName()}'s Turn`}
        </Text>
        {diceValue && (
          <Text style={styles.diceText}>🎲 {diceValue}</Text>
        )}
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        <LudoBoard 
          gameState={gameState}
          currentPlayer={currentTurn}
          diceValue={diceValue}
          onPieceMove={movePiece}
          players={players}
          playerId={playerId}
          canMove={canRollDice}
        />
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.diceButton, !canRollDice && styles.disabledButton]}
          onPress={rollDice}
          disabled={!canRollDice}
        >
          <Text style={styles.diceButtonText}>
            {canRollDice ? '🎲 Roll Dice' : 'Wait...'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaveButton}
          onPress={() => {
            Alert.alert(
              'Leave Game',
              'Are you sure you want to leave the game?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Leave', 
                  style: 'destructive',
                  onPress: () => {
                    if (socket && socket.connected) {
                      socket.emit('LEAVE_FAST_LUDO_GAME', {
                        gameId,
                        playerId,
                      });
                    }
                    // Reset matchmaking state to idle when leaving mid-game
                    cleanupAfterGameEnd();
                    try {
                      navigation.navigate('Home');
                    } catch (error) {
                      console.log('Navigation error:', error);
                    }
                  }
                }
              ]
            );
          }}
        >
          <Text style={styles.leaveButtonText}>Leave Game</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  timer: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff6b35',
  },
  scoresContainer: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  scoresTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  scoresRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  playerName: {
    fontSize: 12,
    color: '#ccc',
  },
  playerScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  turnContainer: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  myTurnContainer: {
    backgroundColor: '#1b5e20',
    borderColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  myTurnText: {
    color: '#4caf50',
    fontSize: 18,
    textShadowColor: '#4caf50',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  diceText: {
    fontSize: 24,
    marginTop: 10,
  },
  gameBoard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
    controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  diceButton: {
    backgroundColor: '#4fc3f7',
    borderRadius: 8,
    padding: 15,
    flex: 1,
    marginRight: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#555',
  },
  diceButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  leaveButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FastLudoGameScreen;