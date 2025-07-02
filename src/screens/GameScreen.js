import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Alert,
} from 'react-native';
import LudoBoard from '../components/LudoBoard';
import { useGame } from '../context/GameContext';

const {width, height} = Dimensions.get('window');

const GameScreen = ({route, navigation}) => {
  const {gameId, playerId, playerName, socket} = route.params;
  const { cleanupAfterGameEnd } = useGame();
  
  const [gameState, setGameState] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [diceValue, setDiceValue] = useState(null);
  const [canRollDice, setCanRollDice] = useState(false);
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting');

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners for Classic Ludo
    socket.on('CLASSIC_LUDO_GAME_STARTED', handleGameStarted);
    socket.on('CLASSIC_LUDO_TURN_UPDATE', handleTurnUpdate);
    socket.on('CLASSIC_LUDO_DICE_ROLLED', handleDiceRolled);
    socket.on('CLASSIC_LUDO_PIECE_MOVED', handlePieceMoved);
    socket.on('CLASSIC_LUDO_GAME_ENDED', handleGameEnded);
    socket.on('CLASSIC_LUDO_ERROR', handleError);
    socket.on('CLASSIC_LUDO_CURRENT_STATE', handleCurrentState);

    return () => {
      console.log('🧹 GameScreen component unmounting, cleaning up...');
      
      // Emit leave game event
      if (socket && socket.connected) {
        socket.emit('LEAVE_CLASSIC_LUDO_GAME', {
          gameId,
          playerId,
        });
      }
      
      socket.off('CLASSIC_LUDO_GAME_STARTED');
      socket.off('CLASSIC_LUDO_TURN_UPDATE');
      socket.off('CLASSIC_LUDO_DICE_ROLLED');
      socket.off('CLASSIC_LUDO_PIECE_MOVED');
      socket.off('CLASSIC_LUDO_GAME_ENDED');
      socket.off('CLASSIC_LUDO_ERROR');
      socket.off('CLASSIC_LUDO_CURRENT_STATE');
      
      // Clean up game state but preserve matchmaking queue
      cleanupAfterGameEnd();
    };
  }, [socket, gameId, playerId, cleanupAfterGameEnd]);

  const handleGameStarted = (data) => {
    console.log('Classic Ludo game started:', data);
    setGameState(data.gameBoard);
    setPlayers(data.players);
    setCurrentTurn(data.currentTurn);
    setGameStatus('playing');
    setCanRollDice(data.currentTurn === playerId);
  };

  const handleTurnUpdate = (data) => {
    setCurrentTurn(data.currentTurn);
    setCanRollDice(data.currentTurn === playerId);
    setDiceValue(null);
  };

  const handleDiceRolled = (data) => {
    setDiceValue(data.diceValue);
    setCanRollDice(false);
  };

  const handlePieceMoved = (data) => {
    setGameState(data.gameBoard);
    // Reset dice after move
    setDiceValue(null);
  };

  const handleGameEnded = (data) => {
    const winnerPlayer = players.find(p => p.id === data.winner);
    const winnerName = winnerPlayer?.name || winnerPlayer?.playerName || 'Unknown';
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nReason: ${data.reason}`,
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

  const handleCurrentState = (data) => {
    setGameState(data.gameBoard);
    setCurrentTurn(data.currentTurn);
    setGameStatus(data.gameStatus);
    setDiceValue(data.diceValue);
    setCanRollDice(data.currentTurn === playerId && !data.diceRolled);
  };

  const rollDice = () => {
    if (canRollDice && socket) {
      socket.emit('ROLL_CLASSIC_LUDO_DICE', {
        gameId,
        playerId
      });
    }
  };

  const movePiece = (pieceId) => {
    if (diceValue && socket) {
      socket.emit('MOVE_CLASSIC_LUDO_PIECE', {
        gameId,
        playerId,
        pieceId
      });
    }
  };

  const getCurrentPlayerName = () => {
    if (!currentTurn || !players || players.length === 0) {
      return 'Unknown';
    }
    const currentPlayer = players.find(p => p.id === currentTurn);
    return currentPlayer?.name || currentPlayer?.playerName || 'Unknown';
  };

  const getMyColor = () => {
    if (!gameState || !players) return null;
    const playerIndex = players.findIndex(p => p.id === playerId);
    const colors = ['red', 'blue', 'green', 'yellow'];
    return colors[playerIndex];
  };

  if (!gameState) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Starting Classic Ludo...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameTitle}>Classic Ludo</Text>
        <Text style={styles.gameId}>Game ID: {gameId}</Text>
      </View>

      {/* Players Info */}
      <View style={styles.playersContainer}>
        {players.map((player, index) => (
          <View key={player.id} style={[
            styles.playerCard,
            currentTurn === player.id && styles.activePlayer
          ]}>
            <Text style={styles.playerName}>{player.name || player.playerName || `Player ${index + 1}`}</Text>
            <Text style={styles.playerColor}>{player.color || 'Color'}</Text>
          </View>
        ))}
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
                      socket.emit('LEAVE_CLASSIC_LUDO_GAME', {
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 20,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  gameId: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 5,
  },
  playersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  playerCard: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    minWidth: 80,
  },
  activePlayer: {
    backgroundColor: '#4fc3f7',
  },
  playerName: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  playerColor: {
    fontSize: 10,
    color: '#ccc',
    marginTop: 2,
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
});

export default GameScreen;