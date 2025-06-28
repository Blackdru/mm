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

const {width, height} = Dimensions.get('window');

const GameScreen = ({route, navigation}) => {
  const {gameId, playerId, playerName, socket} = route.params;
  
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
      socket.off('CLASSIC_LUDO_GAME_STARTED');
      socket.off('CLASSIC_LUDO_TURN_UPDATE');
      socket.off('CLASSIC_LUDO_DICE_ROLLED');
      socket.off('CLASSIC_LUDO_PIECE_MOVED');
      socket.off('CLASSIC_LUDO_GAME_ENDED');
      socket.off('CLASSIC_LUDO_ERROR');
      socket.off('CLASSIC_LUDO_CURRENT_STATE');
    };
  }, [socket]);

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
    const winnerName = players.find(p => p.id === data.winner)?.name || 'Unknown';
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nReason: ${data.reason}`,
      [
        { text: 'Back to Menu', onPress: () => navigation.navigate('Home') }
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
    const currentPlayer = players.find(p => p.id === currentTurn);
    return currentPlayer?.name || 'Unknown';
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
            <Text style={styles.playerName}>{player.name}</Text>
            <Text style={styles.playerColor}>{player.color}</Text>
          </View>
        ))}
      </View>

      {/* Turn Info */}
      <View style={styles.turnContainer}>
        <Text style={styles.turnText}>
          {canRollDice ? "Your Turn!" : `${getCurrentPlayerName()}'s Turn`}
        </Text>
        {diceValue && (
          <Text style={styles.diceText}>🎲 {diceValue}</Text>
        )}
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        <Text style={styles.boardText}>Classic Ludo Board</Text>
        
        {/* Simple piece representation */}
        {getMyColor() && gameState[getMyColor()] && (
          <View style={styles.piecesContainer}>
            <Text style={styles.piecesTitle}>Your Pieces ({getMyColor()})</Text>
            <View style={styles.piecesRow}>
              {gameState[getMyColor()].pieces.map((piece, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.piece,
                    piece.position === 'finished' && styles.finishedPiece
                  ]}
                  onPress={() => movePiece(index)}
                  disabled={!diceValue || piece.position === 'finished'}
                >
                  <Text style={styles.pieceText}>
                    {piece.position === 'finished' ? '🏆' : 
                     piece.position === 'home' ? '🏠' : '🔴'}
                  </Text>
                  <Text style={styles.pieceInfo}>
                    {piece.position === 'finished' ? 'Done' : 
                     piece.position === 'home' ? 'Home' :
                     piece.position === 'homeStretch' ? `H${piece.boardPosition}` :
                     `P${piece.boardPosition}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
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
          onPress={() => navigation.navigate('Home')}
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
  },
  turnText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  diceText: {
    fontSize: 24,
    marginTop: 10,
  },
  gameBoard: {
    flex: 1,
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boardText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  piecesContainer: {
    width: '100%',
  },
  piecesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  piecesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  piece: {
    backgroundColor: '#0f3460',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    minWidth: 60,
  },
  finishedPiece: {
    backgroundColor: '#4caf50',
  },
  pieceText: {
    fontSize: 20,
    marginBottom: 5,
  },
  pieceInfo: {
    fontSize: 10,
    color: '#ccc',
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