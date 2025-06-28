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
    };
  }, [socket]);

  const initializeCardAnimations = () => {
    for (let i = 0; i < 24; i++) {
      cardAnimations[i] = new Animated.Value(0);
    }
  };

  const handleGameStarted = (data) => {
    console.log('Memory game started:', data);
    setGameBoard(data.gameBoard);
    setPlayers(data.players);
    setGameStatus('playing');
    setScores({ score1: 0, score2: 0 });
    setMatchedCards([]);
    setFlippedCards([]);
    setSelectedCards([]);
  };

  const handleCurrentTurn = (data) => {
    console.log('Current turn:', data);
    setCurrentTurn(data.currentPlayer);
    setIsMyTurn(data.currentPlayer === playerId);
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
    const { positions, playerId: matchingPlayer } = data;
    
    // Update matched cards
    setMatchedCards(prev => [...prev, ...positions]);
    
    // Update game board to keep cards face up
    setGameBoard(prev => 
      prev.map((card, index) => 
        positions.includes(index) ? { ...card, isMatched: true } : card
      )
    );

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
    const winnerName = players.find(p => p.id === winner)?.name || 'Unknown';
    
    Alert.alert(
      'Game Over!',
      `Winner: ${winnerName}\nFinal Scores:\nPlayer 1: ${data.finalScores.score1}\nPlayer 2: ${data.finalScores.score2}`,
      [
        { text: 'Play Again', onPress: startNewGame },
        { text: 'Back to Menu', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleCardsMismatched = (data) => {
    console.log('Cards mismatched:', data);
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
    socket.emit('SELECT_MEMORY_CARD', {
      roomId,
      playerId,
      position,
    });
  };

  const startNewGame = () => {
    socket.emit('START_MEMORY_GAME', {
      roomId,
      playerId,
    });
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
    const currentPlayer = players.find(p => p.id === currentTurn);
    return currentPlayer?.name || 'Unknown';
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
            {players[0]?.name || 'Player 1'}: {scores.score1}
          </Text>
          <Text style={styles.scoreText}>
            {players[1]?.name || 'Player 2'}: {scores.score2}
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
          onPress={() => navigation.goBack()}
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
