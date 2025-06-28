import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
  Animated,
  FlatList,
} from 'react-native';
import { io } from 'socket.io-client';

const { width, height } = Dimensions.get('window');

// Card symbols/images for the memory game
const CARD_SYMBOLS = [
  '🎮', '🎯', '🎲', '🃏', '🎪', '🎨', '🎭', '🎪',
  '⚽', '🏀', '🏈', '⚾', '🎾', '🏓', '🏸', '🏐',
  '🚗', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒',
];

const MemoryGameScreen = ({ route, navigation }) => {
  const { roomId, playerId, playerName, socket } = route.params;
  
  // Game state
  const [gameBoard, setGameBoard] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [scores, setScores] = useState({ score1: 0, score2: 0 });
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('waiting'); // waiting, playing, ended
  const [selectedCards, setSelectedCards] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(0);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState(null);
  
  // Animation refs
  const cardAnimations = useRef({}).current;

  useEffect(() => {
    if (!socket) return;

    // Socket event listeners
    socket.on('MEMORY_GAME_STARTED', handleGameStarted);
    socket.on('MEMORY_GAME_CURRENT_TURN', handleCurrentTurn);
    socket.on('MEMORY_CARD_OPENED', handleOpenCard);
    socket.on('MEMORY_CARDS_MATCHED', handleCardsMatched);
    socket.on('MEMORY_CARDS_MISMATCHED', handleCardsMismatched);
    socket.on('MEMORY_GAME_ENDED', handleEndGame);
    socket.on('MEMORY_GAME_ERROR', handleError);
    socket.on('MEMORY_PLAYER_JOINED', handlePlayerJoined);
    socket.on('MEMORY_CURRENT_STATE', handleCurrentState);
    socket.on('MEMORY_PLAYER_LEFT', handlePlayerLeft);
    socket.on('MEMORY_TURN_TIMER', handleTurnTimer);
    socket.on('MEMORY_TURN_TIMER_UPDATE', handleTurnTimerUpdate);
    socket.on('MEMORY_TURN_SKIPPED', handleTurnSkipped);

    // Initialize animations for cards
    initializeCardAnimations();

    return () => {
      socket.off('MEMORY_GAME_STARTED');
      socket.off('MEMORY_GAME_CURRENT_TURN');
      socket.off('MEMORY_CARD_OPENED');
      socket.off('MEMORY_CARDS_MATCHED');
      socket.off('MEMORY_CARDS_MISMATCHED');
      socket.off('MEMORY_GAME_ENDED');
      socket.off('MEMORY_GAME_ERROR');
      socket.off('MEMORY_PLAYER_JOINED');
      socket.off('MEMORY_CURRENT_STATE');
      socket.off('MEMORY_PLAYER_LEFT');
      socket.off('MEMORY_TURN_TIMER');
      socket.off('MEMORY_TURN_TIMER_UPDATE');
      socket.off('MEMORY_TURN_SKIPPED');
    };
  }, [socket]);

  const initializeCardAnimations = () => {
    for (let i = 0; i < 24; i++) {
      cardAnimations[i] = new Animated.Value(0);
    }
  };

  const handleGameStarted = (data) => {
    console.log('Memory game started:', data);
    console.log('Players data:', data.players);
    console.log('Route params - playerId:', playerId, 'playerName:', playerName);
    
    setGameBoard(data.gameBoard);
    setPlayers(data.players || []);
    setGameStatus('playing');
    setScores(data.initialScores || data.scores || { score1: 0, score2: 0 });
    setMatchedCards([]);
    setFlippedCards([]);
    setSelectedCards([]);
  };

  const handleCurrentTurn = (data) => {
    console.log('Current turn:', data);
    setCurrentTurn(data.currentPlayer);
    setIsMyTurn(data.currentPlayer === playerId);
    setCurrentTurnPlayer(data.currentPlayerName || 'Unknown');
    
    // Update players list if provided
    if (data.players) {
      setPlayers(data.players);
    }
  };

  const handleTurnTimer = (data) => {
    console.log('Turn timer started:', data);
    setTurnTimeRemaining(data.timeLeft);
    setCurrentTurnPlayer(data.playerName);
  };

  const handleTurnTimerUpdate = (data) => {
    console.log('Turn timer update:', data);
    setTurnTimeRemaining(data.timeLeft);
  };

  const handleTurnSkipped = (data) => {
    console.log('Turn skipped:', data);
    setCurrentTurnPlayer(data.nextPlayerName);
    Alert.alert(
      'Turn Skipped',
      `${data.nextPlayerName}'s turn now (previous player took too long)`,
      [{ text: 'OK' }]
    );
  };

  const handleOpenCard = (data) => {
    console.log('Card opened:', data);
    const { position, symbol } = data;
    
    // Update game board with revealed card
    setGameBoard(prev => 
      prev.map((card, index) => 
        index === position ? { ...card, isFlipped: true, symbol } : card
      )
    );

    // Animate card flip
    animateCardFlip(position);
    
    // Track flipped cards
    setFlippedCards(prev => [...prev, position]);
  };

  const handleCardsMatched = (data) => {
    console.log('Cards matched:', data);
    const { positions, playerId: matchingPlayer, scores } = data;
    
    // Update matched cards
    setMatchedCards(prev => [...prev, ...positions]);
    
    // Update game board to keep cards face up
    setGameBoard(prev => 
      prev.map((card, index) => 
        positions.includes(index) ? { ...card, isMatched: true } : card
      )
    );

    // Update scores if provided
    if (scores) {
      setScores(scores);
    }

    // Clear flipped cards
    setFlippedCards([]);
    setSelectedCards([]);
  };

  const handleCloseCards = (data) => {
    console.log('Cards closed:', data);
    const { positions } = data;
    
    setTimeout(() => {
      // Animate cards flipping back
      positions.forEach(pos => animateCardFlip(pos, true));
      
      // Update game board to hide cards
      setGameBoard(prev => 
        prev.map((card, index) => 
          positions.includes(index) ? { ...card, isFlipped: false } : card
        )
      );

      // Clear tracking
      setFlippedCards([]);
      setSelectedCards([]);
    }, 1000);
  };

  const handleScoreUpdate = (data) => {
    console.log('Score update:', data);
    setScores(data.scores);
  };

  const handleEndGame = (data) => {
    console.log('Game ended:', data);
    setGameStatus('ended');
    
    const winner = data.winner;
    const winnerPlayer = players.find(p => p.id === winner);
    const winnerName = winnerPlayer?.name || winnerPlayer?.playerName || 'Unknown';
    
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nFinal Scores:\nPlayer 1: ${data.finalScores?.score1 || 0}\nPlayer 2: ${data.finalScores?.score2 || 0}`,
      [
        { text: 'Play Again', onPress: startNewGame },
        { text: 'Back to Menu', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleCardsMismatched = (data) => {
    console.log('Cards mismatched:', data);
    const { positions, nextPlayerName } = data;
    
    // Update current turn player if provided
    if (nextPlayerName) {
      setCurrentTurnPlayer(nextPlayerName);
    }
    
    setTimeout(() => {
      // Animate cards flipping back
      positions.forEach(pos => animateCardFlip(pos, true));
      
      // Update game board to hide cards
      setGameBoard(prev => 
        prev.map((card, index) => 
          positions.includes(index) ? { ...card, isFlipped: false } : card
        )
      );

      // Clear tracking
      setFlippedCards([]);
      setSelectedCards([]);
    }, 1000);
  };

  const handleError = (data) => {
    console.error('Memory game error:', data);
    Alert.alert('Error', data.message);
  };

  const handlePlayerJoined = (data) => {
    console.log('Player joined:', data);
    // Update player list or show notification
  };

  const handleCurrentState = (data) => {
    console.log('Current state received:', data);
    setGameBoard(data.gameBoard);
    setScores(data.scores || {});
    setCurrentTurn(data.currentPlayerId);
    
    // Update players if provided
    if (data.players) {
      console.log('Updating players from current state:', data.players);
      setPlayers(data.players);
    }
  };

  const handlePlayerLeft = (data) => {
    Alert.alert(
      'Player Left',
      `${data.playerName} has left the game.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  
  const animateCardFlip = (position, reverse = false) => {
    const animation = cardAnimations[position];
    Animated.timing(animation, {
      toValue: reverse ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = (position) => {
    if (!isMyTurn || gameStatus !== 'playing') return;
    if (flippedCards.includes(position) || matchedCards.includes(position)) return;
    if (selectedCards.length >= 2) return;

    // Add to selected cards
    setSelectedCards(prev => [...prev, position]);

    // Emit card selection to server
    if (socket && socket.connected) {
      socket.emit('SELECT_MEMORY_CARD', {
        roomId,
        playerId,
        position,
      });
    } else {
      console.log('Socket not connected, cannot select card');
    }
  };

  const startNewGame = () => {
    if (socket && socket.connected) {
      socket.emit('START_MEMORY_GAME', {
        roomId,
        playerId,
      });
    }
  };

  const handleLeaveGame = () => {
    Alert.alert(
      'Leave Game',
      'Are you sure you want to leave the game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            // Emit leave game event
            if (socket && socket.connected) {
              socket.emit('LEAVE_MEMORY_GAME', {
                roomId,
                playerId,
              });
            }
            
            // Navigate back safely
            try {
              navigation.goBack();
            } catch (error) {
              console.log('Navigation error:', error);
              navigation.navigate('Home');
            }
          }
        }
      ]
    );
  };

  const renderCard = ({ item, index }) => {
    const card = item;
    const isFlipped = card.isFlipped || card.isMatched;
    const isSelected = selectedCards.includes(index);
    
    const animatedStyle = {
      transform: [
        {
          rotateY: cardAnimations[index]?.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '180deg'],
          }) || '0deg',
        },
      ],
    };

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.selectedCard,
          card.isMatched && styles.matchedCard,
        ]}
        onPress={() => handleCardPress(index)}
        disabled={!isMyTurn || gameStatus !== 'playing'}
      >
        <Animated.View style={[styles.cardInner, animatedStyle]}>
          <View style={styles.cardFront}>
            <Text style={styles.cardSymbol}>
              {isFlipped ? card.symbol : '?'}
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const getCurrentPlayerName = () => {
    // Use the currentTurnPlayer state if available (from backend)
    if (currentTurnPlayer) {
      return currentTurnPlayer;
    }
    
    if (!currentTurn || !players || players.length === 0) {
      return 'Unknown';
    }
    const currentPlayer = players.find(p => p.id === currentTurn);
    if (currentPlayer) {
      return currentPlayer.name || currentPlayer.playerName || currentPlayer.username || 'Unknown';
    }
    
    // Fallback: if currentTurn matches playerId, use playerName from route
    if (currentTurn === playerId) {
      return playerName || 'You';
    }
    
    return 'Unknown';
  };

  if (gameStatus === 'waiting') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mind Morga</Text>
        <Text style={styles.subtitle}>Memory Card Matching</Text>
        <Text style={styles.waitingText}>Waiting for players...</Text>
        <TouchableOpacity style={styles.startButton} onPress={startNewGame}>
          <Text style={styles.startButtonText}>Start Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mind Morga</Text>
        
        <View style={styles.scoreContainer}>
          <Text style={styles.scoreText}>
            {(() => {
              console.log('Score display - players:', players);
              console.log('Score display - playerId:', playerId);
              console.log('Score display - playerName:', playerName);
              
              // Try to find current player first
              const currentPlayer = players.find(p => p.id === playerId);
              if (currentPlayer) {
                const name = currentPlayer.name || currentPlayer.playerName || currentPlayer.username || playerName || 'You';
                console.log('Found current player:', currentPlayer, 'using name:', name);
                return name;
              }
              // Fallback to first player or use playerName from route
              const player1 = players[0];
              const name = player1?.name || player1?.playerName || player1?.username || playerName || 'Player 1';
              console.log('Using player1 fallback:', player1, 'using name:', name);
              return name;
            })()}: {scores.score1 || 0}
          </Text>
          <Text style={styles.scoreText}>
            {(() => {
              // Try to find other player
              const otherPlayer = players.find(p => p.id !== playerId);
              if (otherPlayer) {
                const name = otherPlayer.name || otherPlayer.playerName || otherPlayer.username || 'Opponent';
                console.log('Found other player:', otherPlayer, 'using name:', name);
                return name;
              }
              // Fallback to second player
              const player2 = players[1];
              const name = player2?.name || player2?.playerName || player2?.username || 'Player 2';
              console.log('Using player2 fallback:', player2, 'using name:', name);
              return name;
            })()}: {scores.score2 || 0}
          </Text>
        </View>
      </View>

      {/* Turn Indicator */}
      <View style={styles.turnContainer}>
        <Text style={[
          styles.turnText,
          isMyTurn && styles.myTurnText
        ]}>
          {isMyTurn ? "Your Turn!" : `${getCurrentPlayerName()}'s Turn`}
        </Text>
        
        {/* Turn Timer */}
        {turnTimeRemaining > 0 && (
          <View style={styles.turnTimerContainer}>
            <Text style={[
              styles.turnTimerText,
              turnTimeRemaining <= 3 && styles.urgentTimer
            ]}>
              ⏱️ {turnTimeRemaining}s
            </Text>
          </View>
        )}
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        <FlatList
          data={gameBoard}
          renderItem={renderCard}
          keyExtractor={(item, index) => index.toString()}
          numColumns={4}
          contentContainerStyle={styles.boardContainer}
          scrollEnabled={false}
        />
      </View>

      {/* Game Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleLeaveGame}
        >
          <Text style={styles.controlButtonText}>Leave Game</Text>
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
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
    scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  turnContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#16213e',
    borderRadius: 10,
  },
  turnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  myTurnText: {
    color: '#4caf50',
  },
  turnTimerContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#2c3e50',
    borderRadius: 8,
  },
  turnTimerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3498db',
    textAlign: 'center',
  },
  urgentTimer: {
    color: '#e74c3c',
    fontSize: 18,
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: (width - 60) / 4 - 10,
    height: (width - 60) / 4 - 10,
    margin: 5,
    borderRadius: 10,
    backgroundColor: '#16213e',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#4fc3f7',
  },
  matchedCard: {
    backgroundColor: '#4caf50',
  },
  cardInner: {
    flex: 1,
    borderRadius: 10,
  },
  cardFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  cardSymbol: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  waitingText: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#4fc3f7',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  controlButton: {
    backgroundColor: '#f44336',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default MemoryGameScreen;
