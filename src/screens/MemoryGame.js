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
  const [prizePool, setPrizePool] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  
  // Animation refs
  const cardAnimations = useRef({}).current;
  const lastCardPressTime = useRef(0);

  useEffect(() => {
    if (!socket) return;

    // Connection monitoring
    socket.on('connect', () => {
      setConnectionStatus('connected');
      setLastActivity(Date.now());
    });
    
    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });
    
    socket.on('reconnect', () => {
      setConnectionStatus('connected');
      setLastActivity(Date.now());
    });

    // Socket event listeners
    socket.on('MEMORY_GAME_STARTED', handleGameStarted);
    socket.on('MEMORY_GAME_CURRENT_TURN', handleCurrentTurn);
    socket.on('MEMORY_CARD_OPENED', handleOpenCard);
    socket.on('MEMORY_CARDS_MATCHED', handleCardsMatched);
    socket.on('MEMORY_CARDS_MISMATCHED', handleCardsMismatched);
    socket.on('MEMORY_CARDS_NO_MATCH', handleCardsNoMatch);
    socket.on('MEMORY_TURN_CHANGED', handleTurnChanged);
    socket.on('MEMORY_GAME_ENDED', handleEndGame);
    socket.on('MEMORY_GAME_ERROR', handleError);
    socket.on('MEMORY_PLAYER_JOINED', handlePlayerJoined);
    socket.on('MEMORY_CURRENT_STATE', handleCurrentState);
    socket.on('MEMORY_PLAYER_LEFT', handlePlayerLeft);
    socket.on('MEMORY_TURN_TIMER', handleTurnTimer);
    socket.on('MEMORY_TURN_TIMER_UPDATE', handleTurnTimerUpdate);
    socket.on('MEMORY_TIMER_UPDATE', handleTurnTimerUpdate);
    socket.on('MEMORY_TURN_SKIPPED', handleTurnSkipped);

    // Initialize animations for cards
    initializeCardAnimations();

    return () => {
      socket.off('MEMORY_GAME_STARTED');
      socket.off('MEMORY_GAME_CURRENT_TURN');
      socket.off('MEMORY_CARD_OPENED');
      socket.off('MEMORY_CARDS_MATCHED');
      socket.off('MEMORY_CARDS_MISMATCHED');
      socket.off('MEMORY_CARDS_NO_MATCH');
      socket.off('MEMORY_TURN_CHANGED');
      socket.off('MEMORY_GAME_ENDED');
      socket.off('MEMORY_GAME_ERROR');
      socket.off('MEMORY_PLAYER_JOINED');
      socket.off('MEMORY_CURRENT_STATE');
      socket.off('MEMORY_PLAYER_LEFT');
      socket.off('MEMORY_TURN_TIMER');
      socket.off('MEMORY_TURN_TIMER_UPDATE');
      socket.off('MEMORY_TIMER_UPDATE');
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
    console.log('Prize pool:', data.prizePool);
    console.log('Route params - playerId:', playerId, 'playerName:', playerName);
    
    setLastActivity(Date.now());
    setGameBoard(data.gameBoard);
    setPlayers(data.players || []);
    setGameStatus('playing');
    
    // Initialize scores properly
    const initialScores = {};
    if (data.players) {
      data.players.forEach(player => {
        initialScores[player.id] = 0;
      });
    }
    setScores(data.scores || initialScores);
    
    setMatchedCards([]);
    setFlippedCards([]);
    setSelectedCards([]);
    setPrizePool(data.prizePool || 0);
    
    // Set initial turn state
    if (data.players && data.players.length > 0) {
      const firstPlayer = data.players[0];
      setCurrentTurn(firstPlayer.id);
      setIsMyTurn(firstPlayer.id === playerId);
      setCurrentTurnPlayer(firstPlayer.name || firstPlayer.playerName || 'Unknown');
    }
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
    // Removed alert as requested - no need for alert when user misses turn
  };

  const handleOpenCard = (data) => {
    console.log('Card opened:', data);
    const { position, symbol } = data;
    
    setLastActivity(Date.now());
    
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
    
    // Reset processing state
    setIsProcessingCard(false);
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
    try {
      console.log('Game ended:', data);
      setGameStatus('ended');
      
      // Safely extract prize pool with fallback
      const safePrizePool = typeof data.prizePool === 'number' ? data.prizePool : (prizePool || 0);
      
      // Use leaderboard data from backend if available, otherwise create it
      let leaderboardData;
      if (data.leaderboard && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
        leaderboardData = data.leaderboard.map(player => {
          const isWinner = player.id === data.winnerId;
          const winAmount = isWinner ? (safePrizePool * 0.9) : 0;
          
          return {
            id: player.id || 'unknown',
            name: player.name || 'Unknown',
            score: typeof player.score === 'number' ? player.score : 0,
            isWinner,
            winAmount
          };
        });
      } else {
        // Fallback to creating leaderboard from players and scores
        const playersToUse = Array.isArray(data.players) ? data.players : (Array.isArray(players) ? players : []);
        leaderboardData = playersToUse.map(player => {
          const playerScore = (data.finalScores && data.finalScores[player.id]) || 0;
          const isWinner = player.id === data.winnerId;
          const winAmount = isWinner ? (safePrizePool * 0.9) : 0;
          
          return {
            id: player.id || 'unknown',
            name: player.name || player.playerName || 'Unknown',
            score: typeof playerScore === 'number' ? playerScore : 0,
            isWinner,
            winAmount
          };
        }).sort((a, b) => b.score - a.score);
      }
      
      // Ensure we have at least one player in leaderboard
      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardData = [{
          id: 'unknown',
          name: 'Unknown Player',
          score: 0,
          isWinner: true,
          winAmount: safePrizePool * 0.9
        }];
      }
      
      setGameResults({
        leaderboard: leaderboardData,
        prizePool: safePrizePool,
        totalPlayers: data.totalPlayers || players.length || 1,
        gameStats: data.gameStats || {},
        reason: data.reason || null
      });
      setShowLeaderboard(true);
    } catch (error) {
      console.error('Error handling end game:', error);
      // Show a basic leaderboard even if there's an error
      setGameResults({
        leaderboard: [{
          id: 'error',
          name: 'Game Ended',
          score: 0,
          isWinner: true,
          winAmount: 0
        }],
        prizePool: 0,
        totalPlayers: 1,
        gameStats: {},
        reason: 'Error processing game results'
      });
      setShowLeaderboard(true);
    }
  };

  const handleCardsMismatched = (data) => {
    console.log('Cards mismatched:', data);
    const { positions, nextPlayerName } = data;
    
    // Update current turn player if provided
    if (nextPlayerName) {
      setCurrentTurnPlayer(nextPlayerName);
    }
    
    // Flip back immediately - no delay needed since backend handles timing
    positions.forEach(pos => animateCardFlip(pos, true));
    
    // Update game board to hide cards immediately
    setGameBoard(prev => 
      prev.map((card, index) => 
        positions.includes(index) ? { ...card, isFlipped: false } : card
      )
    );

    // Clear tracking immediately
    setFlippedCards([]);
    setSelectedCards([]);
  };

  const handleCardsNoMatch = (data) => {
    console.log('Cards no match:', data);
    const { positions } = data;
    
    // Flip back immediately - no delay needed since backend handles timing
    positions.forEach(pos => animateCardFlip(pos, true));
    
    // Update game board to hide cards immediately
    setGameBoard(prev => 
      prev.map((card, index) => 
        positions.includes(index) ? { ...card, isFlipped: false } : card
      )
    );

    // Clear tracking immediately
    setFlippedCards([]);
    setSelectedCards([]);
  };

  const handleTurnChanged = (data) => {
    console.log('Turn changed:', data);
    setCurrentTurn(data.currentPlayerId);
    setIsMyTurn(data.currentPlayerId === playerId);
    setCurrentTurnPlayer(data.currentPlayerName);
    setFlippedCards([]);
    setSelectedCards([]);
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
    setLastActivity(Date.now());
    
    // Restore game board state
    setGameBoard(data.gameBoard || []);
    setScores(data.scores || {});
    setCurrentTurn(data.currentPlayerId);
    setPrizePool(data.prizePool || 0);
    
    // Restore selected cards and processing state
    setSelectedCards(data.selectedCards || []);
    setIsProcessingCard(data.processingCards || false);
    
    // Update players if provided
    if (data.players) {
      console.log('Updating players from current state:', data.players);
      setPlayers(data.players);
    }
    
    // Update current turn info
    if (data.currentPlayer) {
      setCurrentTurn(data.currentPlayer.id);
      setIsMyTurn(data.currentPlayer.id === playerId);
      setCurrentTurnPlayer(data.currentPlayer.name);
    }
    
    // Clear any frozen states after reconnection
    setFlippedCards([]);
    setMatchedCards(data.gameBoard ? data.gameBoard.filter((card, index) => card.isMatched).map((card, index) => index) : []);
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
    if (animation) {
      Animated.timing(animation, {
        toValue: reverse ? 0 : 1,
        duration: 250, // Faster animation for better responsiveness
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCardPress = (position) => {
    const now = Date.now();
    
    // Debounce rapid clicks (300ms minimum between clicks)
    if (now - lastCardPressTime.current < 300) {
      console.log('Card press too rapid, ignoring');
      return;
    }
    lastCardPressTime.current = now;
    
    console.log('Card press attempt:', { position, isMyTurn, gameStatus, flippedCards, matchedCards, selectedCards });
    
    // Check if already processing a card
    if (isProcessingCard) {
      console.log('Already processing a card');
      return;
    }
    
    // Check connection status
    if (connectionStatus !== 'connected') {
      console.log('Not connected to server');
      return;
    }
    
    if (!isMyTurn || gameStatus !== 'playing') {
      console.log('Not your turn or game not playing');
      return;
    }
    
    if (flippedCards.includes(position) || matchedCards.includes(position)) {
      console.log('Card already flipped or matched');
      return;
    }
    
    if (selectedCards.length >= 2) {
      console.log('Already selected 2 cards');
      return;
    }

    // Check if card already selected this turn
    if (selectedCards.includes(position)) {
      console.log('Card already selected this turn');
      return;
    }

    console.log('Emitting card selection to server');
    
    // Set processing state
    setIsProcessingCard(true);
    
    // Optimistically update selected cards for immediate feedback
    setSelectedCards(prev => [...prev, position]);
    
    // Emit card selection to server
    if (socket && socket.connected) {
      socket.emit('SELECT_MEMORY_CARD', {
        roomId,
        playerId,
        position,
      });
      setLastActivity(Date.now());
      
      // Reset processing state after a short delay
      setTimeout(() => setIsProcessingCard(false), 500);
    } else {
      console.log('Socket not connected, cannot select card');
      // Revert optimistic update
      setSelectedCards(prev => prev.filter(p => p !== position));
      setIsProcessingCard(false);
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
    const isMatched = card.isMatched;
    
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

    // If card is matched, make it invisible
    if (isMatched) {
      return (
        <View style={[styles.card, styles.invisibleCard]}>
          {/* Empty invisible card */}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.card,
          isSelected && styles.selectedCard,
        ]}
        onPress={() => handleCardPress(index)}
        disabled={!isMyTurn || gameStatus !== 'playing'}
      >
        <Animated.View style={[styles.cardInner, animatedStyle]}>
          <View style={[
            styles.cardFront,
            isFlipped && styles.cardFlipped
          ]}>
            <Text style={[
              styles.cardSymbol,
              isFlipped && styles.cardSymbolFlipped
            ]}>
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
        
        {/* Connection Status */}
        {connectionStatus !== 'connected' && (
          <View style={styles.connectionStatus}>
            <Text style={styles.connectionStatusText}>
              {connectionStatus === 'disconnected' ? '🔴 Disconnected' : '🟡 Reconnecting...'}
            </Text>
          </View>
        )}
        
        {/* Prize Pool Display */}
        <View style={styles.prizePoolContainer}>
          <Text style={styles.prizePoolLabel}>Prize Pool</Text>
          <Text style={styles.prizePoolAmount}>₹{Number(prizePool || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          {players && players.length > 0 ? (
            players.map((player, index) => {
              const playerScore = scores[player.id] || 0;
              const isMe = player.id === playerId;
              const displayName = isMe ? 'You' : (player.name || player.playerName || `Player ${index + 1}`);
              
              return (
                <Text key={player.id} style={[
                  styles.scoreText,
                  isMe && styles.myScoreText
                ]}>
                  {displayName}: {playerScore}
                </Text>
              );
            })
          ) : (
            <Text style={styles.scoreText}>Loading players...</Text>
          )}
        </View>
      </View>

      {/* Turn Indicator */}
      <View style={[
        styles.turnContainer,
        isMyTurn && styles.myTurnContainer
      ]}>
        <Text style={[
          styles.turnText,
          isMyTurn && styles.myTurnText
        ]}>
          {isMyTurn ? "🎯 YOUR TURN!" : `${getCurrentPlayerName()}'s Turn`}
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

      {/* Leaderboard Modal */}
      {showLeaderboard && gameResults && (
        <View style={styles.leaderboardOverlay}>
          <View style={styles.leaderboardModal}>
            <Text style={styles.leaderboardTitle}>🏆 Game Results</Text>
            
            {gameResults.reason && (
              <View style={styles.gameReasonContainer}>
                <Text style={styles.gameReasonText}>{gameResults.reason}</Text>
              </View>
            )}
            
            <View style={styles.prizePoolDisplay}>
              <Text style={styles.prizePoolDisplayText}>
                Total Prize Pool: ₹{(gameResults.prizePool || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.leaderboardList}>
              {gameResults.leaderboard.map((player, index) => (
                <View key={player.id} style={[
                  styles.leaderboardItem,
                  player.isWinner && styles.winnerItem
                ]}>
                  <View style={styles.rankContainer}>
                    <Text style={styles.rankText}>#{index + 1}</Text>
                    {player.isWinner && <Text style={styles.crownIcon}>👑</Text>}
                  </View>
                  
                  <View style={styles.playerInfo}>
                    <Text style={[
                      styles.playerNameText,
                      player.isWinner && styles.winnerText
                    ]}>
                      {player.name}
                    </Text>
                    <Text style={styles.playerScoreText}>
                      Score: {player.score}
                    </Text>
                  </View>
                  
                  <View style={styles.winAmountContainer}>
                    <Text style={[
                      styles.winAmountText,
                      player.isWinner && styles.winnerAmountText
                    ]}>
                      {player.winAmount > 0 ? `+₹${player.winAmount.toFixed(2)}` : '₹0.00'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.backToMenuButton}
              onPress={() => {
                setShowLeaderboard(false);
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.backToMenuButtonText}>Back to Menu</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  myScoreText: {
    color: '#4caf50',
    textShadowColor: '#4caf50',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  turnContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#16213e',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  myTurnContainer: {
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderColor: '#00e676',
    borderWidth: 3,
    shadowColor: '#00e676',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 15,
    transform: [{ scale: 1.02 }],
  },
  turnText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  myTurnText: {
    color: '#00e676',
    fontSize: 22,
    fontWeight: '900',
    textShadowColor: '#00e676',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 15,
    letterSpacing: 1,
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
    backgroundColor: '#2c3e50', // Dark blue-gray background
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  invisibleCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
  },
  selectedCard: {
    borderWidth: 3,
    borderColor: '#FFD700', // Gold border for selected
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
    backgroundColor: '#2c3e50', // Dark blue-gray background
  },
  cardFlipped: {
    backgroundColor: '#e8f5e9', // Light green background when flipped
  },
  cardSymbol: {
    fontSize: 32, // Larger icons for better visibility
    color: '#fff',
    fontWeight: 'bold',
  },
  cardSymbolFlipped: {
    color: '#333', // Dark color on white background
    fontSize: 36, // Even larger when flipped
  },
  prizePoolContainer: {
    backgroundColor: '#FFD700',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  prizePoolLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  prizePoolAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  leaderboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  leaderboardModal: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 20,
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 20,
  },
  prizePoolDisplay: {
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  prizePoolDisplayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4fc3f7',
  },
  leaderboardList: {
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213e',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  winnerItem: {
    backgroundColor: '#1b5e20',
    borderColor: '#4caf50',
    borderWidth: 2,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  crownIcon: {
    fontSize: 20,
    marginLeft: 5,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 15,
  },
  playerNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  winnerText: {
    color: '#4caf50',
  },
  playerScoreText: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 2,
  },
  winAmountContainer: {
    alignItems: 'flex-end',
  },
  winAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ccc',
  },
  winnerAmountText: {
    color: '#4caf50',
    fontSize: 18,
  },
  backToMenuButton: {
    backgroundColor: '#4fc3f7',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  backToMenuButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
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
  connectionStatus: {
    backgroundColor: '#ff5722',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginBottom: 10,
  },
  connectionStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  gameReasonContainer: {
    backgroundColor: '#ff9800',
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  gameReasonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MemoryGameScreen;
