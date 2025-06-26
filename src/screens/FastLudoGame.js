import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const FastLudoGameScreen = ({ route, navigation }) => {
  const { gameId, playerId, playerName, socket } = route.params;
  
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
      socket.off('FAST_LUDO_GAME_STARTED');
      socket.off('FAST_LUDO_TURN_UPDATE');
      socket.off('FAST_LUDO_DICE_ROLLED');
      socket.off('FAST_LUDO_PIECE_MOVED');
      socket.off('FAST_LUDO_GAME_ENDED');
      socket.off('FAST_LUDO_ERROR');
    };
  }, [socket]);

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
    const winnerName = players.find(p => p.id === data.winner)?.name || 'Unknown';
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nReason: ${data.reason === 'timer' ? 'Time Up!' : 'All tokens finished'}\n\nFinal Scores:\n${Object.keys(data.finalScores).map(pid => {
        const pName = players.find(p => p.id === pid)?.name || pid;
        return `${pName}: ${data.finalScores[pid]} points`;
      }).join('\n')}`,
      [
        { text: 'Back to Menu', onPress: () => navigation.navigate('Home') }
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
    if (!players[currentTurn]) return 'Unknown';
    return players[currentTurn].name;
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
              <Text style={styles.playerName}>{player.name}</Text>
              <Text style={styles.playerScore}>{scores[player.id] || 0}</Text>
            </View>
          ))}
        </View>
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

      {/* Game Board Placeholder */}
      <View style={styles.gameBoard}>
        <Text style={styles.boardText}>Fast Ludo Board</Text>
        <Text style={styles.boardSubtext}>All tokens start outside!</Text>
        
        {/* Simple piece representation */}
        {getMyColor() && gameState[getMyColor()] && (
          <View style={styles.piecesContainer}>
            <Text style={styles.piecesTitle}>Your Tokens ({getMyColor()})</Text>
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
                    {piece.position === 'finished' ? '🏆' : '🔴'}
                  </Text>
                  <Text style={styles.pieceInfo}>
                    {piece.position === 'finished' ? 'Done' : 
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
    marginBottom: 10,
  },
  boardSubtext: {
    fontSize: 14,
    color: '#ccc',
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
  waitingText: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default FastLudoGameScreen;