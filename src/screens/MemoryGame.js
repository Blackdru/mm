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
import { useGame } from '../context/GameContext';

const { width, height } = Dimensions.get('window');

// Card symbols/images for the memory game - 15 unique symbols for 30 cards (15 pairs)
const CARD_SYMBOLS = [
  '🎮', '🎯', '🎲', '🃏', '🎨', '🎭', '🎪',
  '⚽', '🏀', '🏓', '🏸', '🏎️', '🚒', '🎾', '🏈'
];

const MemoryGameScreen = ({ route, navigation }) => {
  const { roomId, playerId, playerName, socket } = route.params;
  const { cleanupGameState, cleanupAfterGameEnd } = useGame();
  
  // Game state
  const [gameBoard, setGameBoard] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedCards, setMatchedCards] = useState([]);
  const [currentTurn, setCurrentTurn] = useState(null);
  const [scores, setScores] = useState({ score1: 0, score2: 0 });
  const [players, setPlayers] = useState([]);
  const [gameStatus, setGameStatus] = useState('playing'); // playing, ended - removed waiting state
  const [selectedCards, setSelectedCards] = useState([]);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turnTimeRemaining, setTurnTimeRemaining] = useState(0);
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState(null);
  const [localTimerActive, setLocalTimerActive] = useState(false);
  const [prizePool, setPrizePool] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [gameResults, setGameResults] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connected');
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [isProcessingCard, setIsProcessingCard] = useState(false);
  const [leaderboardTimer, setLeaderboardTimer] = useState(5);
  
  // Lifelines state
  const [lifelines, setLifelines] = useState({});
  const [missedTurns, setMissedTurns] = useState({});
  
  // Grid layout - no more scattered positions needed
  
  // Notification state
  const [notification, setNotification] = useState(null);
  
  // Auto-hide notification after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification]);
  
  // Animation refs
  const cardAnimations = useRef({}).current;
  const lastCardPressTime = useRef(0);
  const localTimerRef = useRef(null);

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
    socket.on('MEMORY_CARDS_TIMEOUT_FLIP_BACK', handleTimeoutFlipBack);
    socket.on('MEMORY_LIFELINE_LOST', handleLifelineLost);
    socket.on('MEMORY_PLAYER_ELIMINATED', handlePlayerEliminated);

    // Initialize animations for cards
    initializeCardAnimations();

    return () => {
      console.log('🧹 MemoryGame component unmounting, cleaning up...');
      
      // Emit leave game event
      if (socket && socket.connected) {
        socket.emit('LEAVE_MEMORY_GAME', {
          roomId,
          playerId,
        });
      }
      
      // Remove all socket listeners
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
      socket.off('MEMORY_CARDS_TIMEOUT_FLIP_BACK');
      socket.off('MEMORY_LIFELINE_LOST');
      socket.off('MEMORY_PLAYER_ELIMINATED');
      
      // Only clean up game state, not matchmaking (preserve queue)
      setTimeout(() => cleanupGameState(), 0);
    };
  }, [socket]);

  // Local timer effect to keep countdown running smoothly
  useEffect(() => {
    if (localTimerActive && turnTimeRemaining > 0) {
      localTimerRef.current = setInterval(() => {
        setTurnTimeRemaining(prev => {
          if (prev <= 1) {
            setLocalTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    }

    return () => {
      if (localTimerRef.current) {
        clearInterval(localTimerRef.current);
        localTimerRef.current = null;
      }
    };
  }, [localTimerActive, turnTimeRemaining]);

  const initializeCardAnimations = () => {
    for (let i = 0; i < 30; i++) {
      cardAnimations[i] = new Animated.Value(0);
    }
  };

  // Simple grid layout for 30 cards (5 columns x 6 rows)
  const getCardGridPosition = (index) => {
    const cols = 5;
    const rows = 6;
    const containerWidth = width - 25; // Reduced from 50 to 40
    const cardSpacing = 15; // Reduced spacing
    const cardWidth = (containerWidth - (cardSpacing * (cols + 1))) / cols;
    const cardHeight = cardWidth * 0.9; // Slightly rectangular for better fit
    
    const row = Math.floor(index / cols);
    const col = index % cols;
    
    return {
      left: cardSpacing + col * (cardWidth + cardSpacing),
      top: cardSpacing + row * (cardHeight + cardSpacing),
      width: cardWidth,
      height: cardHeight
    };
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
    
    // Set lifelines from server data or initialize
    if (data.lifelines) {
      setLifelines(data.lifelines);
    } else {
      const initialLifelines = {};
      if (data.players) {
        data.players.forEach(player => {
          initialLifelines[player.id] = 3;
        });
      }
      setLifelines(initialLifelines);
    }
    
    // Initialize missed turns
    const initialMissedTurns = {};
    if (data.players) {
      data.players.forEach(player => {
        initialMissedTurns[player.id] = 0;
      });
    }
    setMissedTurns(initialMissedTurns);
    
    setMatchedCards([]);
    setFlippedCards([]);
    setSelectedCards([]);
    
    // Set prize pool with debugging
    const newPrizePool = data.prizePool || 0;
    setPrizePool(newPrizePool);
    console.log('Setting prize pool on game start:', newPrizePool);
    
    // Set initial turn state
    if (data.players && data.players.length > 0) {
      const firstPlayer = data.players[0];
      setCurrentTurn(firstPlayer.id);
      setIsMyTurn(firstPlayer.id === playerId);
      setCurrentTurnPlayer(firstPlayer.name || firstPlayer.playerName || 'Unknown');
    }
  };

  // Auto-join room and start game when component mounts
  useEffect(() => {
    if (socket && socket.connected && roomId && playerId) {
      console.log('Auto-joining memory game room:', roomId);
      socket.emit('JOIN_MEMORY_ROOM', {
        roomId,
        playerId,
        playerName
      });
    }
  }, [socket, roomId, playerId, playerName]);

  const handleCurrentTurn = (data) => {
    console.log('Current turn:', data);
    setCurrentTurn(data.currentPlayer);
    setIsMyTurn(data.currentPlayer === playerId);
    setCurrentTurnPlayer(data.currentPlayerName || 'Unknown');
    
    // Reset timer when turn changes
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
    
    // Update players list if provided
    if (data.players) {
      setPlayers(data.players);
    }
  };

  const handleTurnTimer = (data) => {
    console.log('Turn timer started:', data);
    setTurnTimeRemaining(data.timeLeft);
    setCurrentTurnPlayer(data.playerName);
    setLocalTimerActive(true); // Start local countdown
  };

  const handleTurnTimerUpdate = (data) => {
    console.log('Turn timer update:', data);
    // Sync with backend timer but don't interrupt local countdown
    const backendTime = data.timeLeft;
    const currentTime = turnTimeRemaining;
    
    // Only update if there's a significant difference (more than 2 seconds)
    // This prevents constant interruption of smooth local countdown
    if (Math.abs(backendTime - currentTime) > 2) {
      setTurnTimeRemaining(backendTime);
    }
    
    // Ensure local timer is active if we have time remaining
    if (backendTime > 0 && !localTimerActive) {
      setLocalTimerActive(true);
    } else if (backendTime <= 0) {
      setLocalTimerActive(false);
    }
  };

  const handleTurnSkipped = (data) => {
    console.log('Turn skipped:', data);
    setCurrentTurnPlayer(data.nextPlayerName);
    
    // Reset timer state when turn is skipped
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
  };

  const handleLifelineLost = (data) => {
    console.log('Lifeline lost:', data);
    const { playerId, remainingLifelines, playerName } = data;
    
    // Update lifelines
    setLifelines(prev => ({
      ...prev,
      [playerId]: remainingLifelines
    }));
    
    // Show notification
    setNotification({
      type: 'lifeline',
      message: `${playerName} lost a lifeline! (${remainingLifelines} remaining)`,
      timestamp: Date.now()
    });
  };

  const handlePlayerEliminated = (data) => {
    console.log('Player eliminated:', data);
    const { playerId, playerName, reason } = data;
    
    // Update lifelines to 0
    setLifelines(prev => ({
      ...prev,
      [playerId]: 0
    }));
    
    // Show notification
    setNotification({
      type: 'elimination',
      message: `${playerName} has been eliminated! (No lifelines remaining)`,
      timestamp: Date.now()
    });
  };

  const handleTimeoutFlipBack = (data) => {
    console.log('Timeout flip back:', data);
    const { positions } = data;
    
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
  };

  const handleOpenCard = (data) => {
    console.log('Card opened:', data);
    const { position, symbol, selectedCount } = data;
    
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
    
    // If this is the second card, pause the local timer as the turn is complete
    if (selectedCount === 2) {
      setLocalTimerActive(false);
    }
    
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
    
    // Reset timer state - player gets another turn so timer will restart
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
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
      console.log('Prize pool from data:', data.prizePool);
      console.log('Leaderboard from data:', data.leaderboard);
      setGameStatus('ended');
      
      // Safely extract prize pool with fallback - prioritize current state
      const safePrizePool = typeof data.prizePool === 'number' && data.prizePool > 0 
        ? data.prizePool 
        : (typeof prizePool === 'number' && prizePool > 0 ? prizePool : 0);
      console.log('Safe prize pool for leaderboard:', safePrizePool);
      console.log('Data prize pool:', data.prizePool, 'State prize pool:', prizePool);
      
      // Use leaderboard data from backend if available, otherwise create it
      let leaderboardData;
      if (data.leaderboard && Array.isArray(data.leaderboard) && data.leaderboard.length > 0) {
        console.log('Using backend leaderboard data:', data.leaderboard);
        console.log('Final scores from backend:', data.finalScores);
        
        leaderboardData = data.leaderboard.map((player, index) => {
          const isWinner = index === 0 || player.id === data.winnerId; // First place or explicit winner
          const winAmount = isWinner ? safePrizePool : 0; // Winner gets the full prize pool (already calculated as 90% of entry fees)
          
          // Use score from leaderboard data, fallback to finalScores, then current scores
          const playerScore = typeof player.score === 'number' ? player.score 
            : (data.finalScores && data.finalScores[player.id]) 
            || scores[player.id] || 0;
          
          console.log(`Player ${player.name}: score=${playerScore}, isWinner=${isWinner}, winAmount=${winAmount}, prizePool=${safePrizePool}`);
          
          return {
            id: player.id || 'unknown',
            name: player.name || 'Unknown',
            score: playerScore,
            isWinner,
            winAmount: Math.round(winAmount * 100) / 100, // Round to 2 decimal places
            displayName: player.name || 'Unknown Player',
            lifelines: lifelines[player.id] || 0
          };
        });
      } else {
        console.log('Creating leaderboard from players and scores');
        console.log('Available data - players:', data.players, 'finalScores:', data.finalScores, 'current scores:', scores);
        
        // Fallback to creating leaderboard from players and scores
        const playersToUse = Array.isArray(data.players) ? data.players : (Array.isArray(players) ? players : []);
        leaderboardData = playersToUse.map(player => {
          // Try multiple sources for the score
          const playerScore = (data.finalScores && typeof data.finalScores[player.id] === 'number') 
            ? data.finalScores[player.id]
            : (typeof scores[player.id] === 'number' ? scores[player.id] : 0);
            
          const isWinner = player.id === data.winnerId;
          const winAmount = isWinner ? safePrizePool : 0; // Winner gets the full prize pool (already calculated as 90% of entry fees)
          
          console.log(`Fallback Player ${player.name}: score=${playerScore}, isWinner=${isWinner}, winAmount=${winAmount}, prizePool=${safePrizePool}`);
          
          return {
            id: player.id || 'unknown',
            name: player.name || player.playerName || 'Unknown',
            score: playerScore,
            isWinner,
            winAmount: Math.round(winAmount * 100) / 100, // Round to 2 decimal places
            displayName: player.name || player.playerName || `Player ${player.position + 1}` || 'Unknown Player',
            lifelines: lifelines[player.id] || 0
          };
        }).sort((a, b) => b.score - a.score);
        
        // Ensure the highest scorer is marked as winner if no explicit winner
        if (leaderboardData.length > 0 && !data.winnerId) {
          leaderboardData[0].isWinner = true;
          leaderboardData[0].winAmount = Math.round(safePrizePool);
          console.log(`Auto-assigned winner: ${leaderboardData[0].name}, winAmount: ${leaderboardData[0].winAmount}`);
        }
      }
      
      // Ensure we have at least one player in leaderboard
      if (!leaderboardData || leaderboardData.length === 0) {
        leaderboardData = [{
          id: 'unknown',
          name: 'Unknown Player',
          score: 0,
          isWinner: true,
          winAmount: Math.round(safePrizePool * 100) / 100,
          displayName: 'Unknown Player',
          lifelines: 0
        }];
      }
      
      console.log('Final leaderboard data with win amounts:', leaderboardData);
      
      setGameResults({
        leaderboard: leaderboardData,
        prizePool: safePrizePool,
        totalPlayers: data.totalPlayers || players.length || 1,
        gameStats: data.gameStats || {},
        reason: data.reason || null
      });
      setShowLeaderboard(true);
      
      // Start 5-second countdown timer for auto-close
      setLeaderboardTimer(5);
      const timerInterval = setInterval(() => {
        setLeaderboardTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            // Auto-close leaderboard and reset to idle
            handleLeaderboardClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
    } catch (error) {
      console.error('Error handling end game:', error);
      // Show a basic leaderboard even if there's an error
      setGameResults({
        leaderboard: [{
          id: 'error',
          name: 'Game Ended',
          score: 0,
          isWinner: true,
          winAmount: 0,
          displayName: 'Game Ended'
        }],
        prizePool: 0,
        totalPlayers: 1,
        gameStats: {},
        reason: 'Error processing game results'
      });
      setShowLeaderboard(true);
      
      // Start 5-second countdown timer for auto-close even on error
      setLeaderboardTimer(5);
      const timerInterval = setInterval(() => {
        setLeaderboardTimer(prev => {
          if (prev <= 1) {
            clearInterval(timerInterval);
            // Auto-close leaderboard and reset to idle
            handleLeaderboardClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
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
    
    // Reset timer state - turn is changing
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
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
    
    // Reset timer state - turn is changing
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
  };

  const handleTurnChanged = (data) => {
    console.log('Turn changed:', data);
    setCurrentTurn(data.currentPlayerId);
    setIsMyTurn(data.currentPlayerId === playerId);
    setCurrentTurnPlayer(data.currentPlayerName);
    setFlippedCards([]);
    setSelectedCards([]);
    
    // Reset timer when turn changes
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
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
    
    // Update prize pool if provided
    if (typeof data.prizePool === 'number' && data.prizePool >= 0) {
      setPrizePool(data.prizePool);
      console.log('Updated prize pool from current state:', data.prizePool);
    }
    
    // Restore lifelines if provided
    if (data.lifelines) {
      setLifelines(data.lifelines);
    }
    
    // Grid layout doesn't need position restoration
    
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
        duration: 300,
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
    setGameBoard(prev => prev.map((card, idx) => idx === position ? { ...card, isFlipped: true } : card));
    animateCardFlip(position);
    
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
      setGameBoard(prev => prev.map((card, idx) => idx === position ? { ...card, isFlipped: false } : card));
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
            // Clear local timer
            setLocalTimerActive(false);
            if (localTimerRef.current) {
              clearInterval(localTimerRef.current);
              localTimerRef.current = null;
            }
            
            // Emit leave game event
            if (socket && socket.connected) {
              socket.emit('LEAVE_MEMORY_GAME', {
                roomId,
                playerId,
              });
            }
            
            // Complete cleanup when leaving mid-game - this resets matchmaking to idle
            setTimeout(() => cleanupAfterGameEnd(), 0);
            
            // Navigate back safely
            try {
              navigation.navigate('Home');
            } catch (error) {
              console.log('Navigation error:', error);
              navigation.navigate('Home');
            }
          }
        }
      ]
    );
  };

  const handleLeaderboardClose = () => {
    console.log('🏆 Auto-closing leaderboard and resetting to idle state');
    setShowLeaderboard(false);
    
    // Reset game state before going home
    if (socket && socket.connected) {
      socket.emit('LEAVE_MEMORY_GAME', {
        roomId,
        playerId,
      });
    }
    
    // Clear local timer
    setLocalTimerActive(false);
    if (localTimerRef.current) {
      clearInterval(localTimerRef.current);
      localTimerRef.current = null;
    }
    
    // Reset all local state
    setGameBoard([]);
    setPlayers([]);
    setScores({});
    setGameStatus('playing');
    setCurrentTurn(null);
    setIsMyTurn(false);
    setSelectedCards([]);
    setFlippedCards([]);
    setMatchedCards([]);
    setPrizePool(0);
    setGameResults(null);
    setLeaderboardTimer(5);
    setTurnTimeRemaining(0);
    
    // Complete cleanup after game end - this will reset matchmaking to idle
    setTimeout(() => {
      cleanupAfterGameEnd();
      console.log('🏠 Navigating back to Home after game completion');
      navigation.navigate('Home');
    }, 0);
  };

  const renderCard = (card, index) => {
    const isFlipped = card.isFlipped || card.isMatched;
    const isSelected = selectedCards.includes(index);
    const isMatched = card.isMatched;
    const gridPosition = getCardGridPosition(index);
    
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
        <View 
          key={index}
          style={[
            styles.gridCard, 
            styles.invisibleCard,
            gridPosition
          ]}
        >
          {/* Empty invisible card */}
        </View>
      );
    }

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.gridCard,
          gridPosition,
          isSelected && styles.selectedCard,
          !isMyTurn && styles.disabledCard,
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

  // Show loading state if game hasn't started yet
  if (!gameBoard || gameBoard.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🧠 Mind Morga</Text>
          <Text style={styles.subtitle}>Memory Card Matching</Text>
          <Text style={styles.waitingText}>Loading game...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🧠 Mind Morga</Text>
        
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
          <Text style={styles.prizePoolLabel}>💰 Prize Pool</Text>
          <Text style={styles.prizePoolAmount}>₹{Number(prizePool || 0).toFixed(2)}</Text>
        </View>
        
        <View style={styles.scoreContainer}>
          {players && players.length > 0 ? (
            players.map((player, index) => {
              const playerScore = scores[player.id] || 0;
              const playerLifelines = lifelines[player.id] || 3;
              const isMe = player.id === playerId;
              const displayName = isMe ? 'You' : (player.name || player.playerName || `Player ${index + 1}`);
              
              return (
                <View key={player.id} style={[
                  styles.scoreCard,
                  isMe && styles.myScoreCard,
                  playerLifelines === 0 && styles.eliminatedCard
                ]}>
                  <Text style={[
                    styles.scorePlayerName,
                    isMe && styles.myScorePlayerName
                  ]}>
                    {displayName}
                  </Text>
                  <Text style={[
                    styles.scoreText,
                    isMe && styles.myScoreText
                  ]}>
                    {playerScore} pts
                  </Text>
                  <View style={styles.lifelinesContainer}>
                    {[1, 2, 3].map(heartIndex => (
                      <Text 
                        key={heartIndex}
                        style={[
                          styles.heartIcon,
                          heartIndex <= playerLifelines ? styles.activeHeart : styles.inactiveHeart
                        ]}
                      >
                        ❤️
                      </Text>
                    ))}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={styles.scoreText}>Loading players...</Text>
          )}
        </View>
      </View>

      {/* Turn Indicator - Fixed Height Container */}
      <View style={styles.turnIndicatorContainer}>
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
          
          {/* Turn Timer - Always reserve space */}
          <View style={styles.turnTimerContainer}>
            {turnTimeRemaining > 0 ? (
              <Text style={[
                styles.turnTimerText,
                turnTimeRemaining <= 3 && styles.urgentTimer
              ]}>
                ⏱️ {turnTimeRemaining}s
              </Text>
            ) : (
              <Text style={styles.turnTimerPlaceholder}>⏱️ --s</Text>
            )}
          </View>
        </View>
      </View>

      {/* Game Board */}
      <View style={styles.gameBoard}>
        <View style={styles.gridContainer}>
          {gameBoard.map((card, index) => renderCard(card, index))}
        </View>
      </View>

      {/* Game Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleLeaveGame}
        >
          <Text style={styles.controlButtonText}>🚪 Leave Game</Text>
        </TouchableOpacity>
      </View>

      {/* Notification */}
      {notification && (
        <View style={[
          styles.notification,
          notification.type === 'elimination' ? styles.eliminationNotification : styles.lifelineNotification
        ]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

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
                💰 Total Prize Pool: ₹{Number(prizePool || 0).toFixed(2)}
              </Text>
            </View>

            <View style={styles.leaderboardList}>
              {gameResults.leaderboard.map((player, index) => {
                // Winner is always the first in the sorted leaderboard
                const isWinner = index === 0;
                return (
                  <View key={player.id} style={[
                    styles.leaderboardItem,
                    isWinner && styles.winnerItem
                  ]}>
                    <View style={styles.rankContainer}>
                      <Text style={styles.rankText}>#{index + 1}</Text>
                      {isWinner && <Text style={styles.crownIcon}>👑</Text>}
                    </View>
                    <View style={styles.playerInfo}>
                      <Text style={[
                        styles.playerNameText,
                        isWinner && styles.winnerText
                      ]}>
                        {player.displayName || player.name || 'Unknown Player'}
                      </Text>
                      <Text style={styles.playerScoreText}>
                        Score: {typeof player.score === 'number' ? player.score : 0}
                      </Text>
                      <Text style={styles.playerLifelinesText}>
                        ❤️ {player.lifelines || 0} lifelines
                      </Text>
                    </View>
                    <View style={styles.winAmountContainer}>
                      <Text style={[
                        styles.winAmountText,
                        isWinner && styles.winnerAmountText
                      ]}>
                        {isWinner ? `+₹${Number(prizePool || 0).toFixed(2)}` : '₹0.00'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Auto-close timer display */}
            <View style={styles.timerContainer}>
              <Text style={styles.timerText}>
                Returning to menu in {leaderboardTimer} seconds...
              </Text>
              <View style={styles.timerBar}>
                <View 
                  style={[
                    styles.timerProgress, 
                    { width: `${(leaderboardTimer / 5) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  header: {
    alignItems: 'center',
    marginBottom: 8,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b35',
    marginBottom: 4,
    textShadowColor: 'rgba(255, 107, 53, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 12,
    color: '#a8b2d1',
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
    gap: 8,
    marginBottom: 6,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    shadowColor: '#ff6b35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  myScoreCard: {
    backgroundColor: '#2a1a0f',
    borderColor: '#ff6b35',
    borderWidth: 2,
    shadowColor: '#ff6b35',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  eliminatedCard: {
    backgroundColor: '#2a1a1a',
    borderColor: '#ff6b6b',
    borderWidth: 1,
    opacity: 0.6,
  },
  scorePlayerName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ccd6f6',
    marginBottom: 2,
  },
  myScorePlayerName: {
    color: '#ff6b35',
  },
  scoreText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffaa00',
  },
  myScoreText: {
    color: '#ff6b35',
    textShadowColor: 'rgba(255, 107, 53, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  lifelinesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    justifyContent: 'center',
    gap: 2,
  },
  heartIcon: {
    fontSize: 10,
  },
  activeHeart: {
    color: '#ff6b6b',
    opacity: 1,
  },
  inactiveHeart: {
    color: '#666',
    opacity: 0.3,
  },
  turnIndicatorContainer: {
    height: 50,
    justifyContent: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  turnContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#3a3f5f',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  myTurnContainer: {
    backgroundColor: '#1e3a5f',
    borderColor: '#00d4ff',
    borderWidth: 2,
    shadowColor: '#00d4ff',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  turnText: {
    fontSize: 14,
    color: '#ccd6f6',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  myTurnText: {
    color: '#00d4ff',
    fontSize: 14,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 212, 255, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  turnTimerContainer: {
    height: 24,
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#16213e',
    borderRadius: 12,
    minWidth: 60,
  },
  turnTimerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#64ffda',
    textAlign: 'center',
  },
  turnTimerPlaceholder: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#8892b0',
    textAlign: 'center',
  },
  urgentTimer: {
    color: '#ff6b6b',
    fontSize: 16,
    textShadowColor: '#ff6b6b',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  gridContainer: {
    position: 'relative',
    width: width - 40,
    height: (() => {
      const containerWidth = width - 40;
      const cardSpacing = 4;
      const cardWidth = (containerWidth - (cardSpacing * 6)) / 5; // 5 cols, 6 spacings
      const cardHeight = cardWidth * 0.9;
      return cardSpacing * 7 + cardHeight * 6; // 6 rows, 7 spacings
    })(),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCard: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    elevation: 4,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#3a3f5f',
  },
  boardContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: (width - 80) / 4 - 8,
    height: (width - 80) / 4 - 8,
    margin: 4,
    borderRadius: 15,
    backgroundColor: '#1a1a2e',
    elevation: 8,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#16213e',
  },
  disabledCard: {
    opacity: 0.5,
    shadowOpacity: 0.1,
  },
  invisibleCard: {
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    borderWidth: 0,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#00d4ff',
    transform: [{ scale: 1.1 }],
    shadowColor: '#00d4ff',
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 15,
  },
  cardInner: {
    flex: 1,
    borderRadius: 16,
  },
  cardFront: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#1a1a2e',
  },
  cardFlipped: {
    backgroundColor: '#1e3a5f',
    borderColor: '#00d4ff',
  },
  cardSymbol: {
    fontSize: 18, // Further reduced for better fit
    color: '#a8b2d1',
    fontWeight: 'bold',
  },
  cardSymbolFlipped: {
    color: '#00d4ff',
    fontSize: 20, // Further reduced for better fit
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  prizePoolContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  prizePoolLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00d4ff',
  },
  prizePoolAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  leaderboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
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
    borderColor: '#00d4ff',
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00d4ff',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  prizePoolDisplay: {
    backgroundColor: '#1e3a5f',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#00d4ff',
  },
  prizePoolDisplayText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00d4ff',
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
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
    backgroundColor: '#1e3a5f',
    borderColor: '#00d4ff',
    borderWidth: 2,
    shadowColor: '#00d4ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  rankText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ccd6f6',
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
    color: '#ccd6f6',
  },
  winnerText: {
    color: '#00d4ff',
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  playerScoreText: {
    fontSize: 14,
    color: '#8892b0',
    marginTop: 2,
  },
  playerLifelinesText: {
    fontSize: 12,
    color: '#00d4ff',
    marginTop: 2,
  },
  winAmountContainer: {
    alignItems: 'flex-end',
  },
  winAmountText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8892b0',
  },
  winnerAmountText: {
    color: '#00d4ff',
    fontSize: 18,
    textShadowColor: 'rgba(0, 212, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  timerContainer: {
    alignItems: 'center',
    padding: 20,
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d4ff',
    marginBottom: 10,
    textAlign: 'center',
  },
  timerBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#16213e',
    borderRadius: 3,
    overflow: 'hidden',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#00d4ff',
    borderRadius: 3,
  },
  waitingText: {
    fontSize: 20,
    color: '#ccd6f6',
    textAlign: 'center',
    marginBottom: 30,
  },
  startButton: {
    backgroundColor: '#00d4ff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f0f23',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 8,
  },
  controlButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    minWidth: 100,
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  connectionStatus: {
    backgroundColor: '#ff6b6b',
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
  notification: {
    position: 'absolute',
    top: 80,
    left: 15,
    right: 15,
    padding: 12,
    borderRadius: 8,
    zIndex: 999,
    elevation: 10,
  },
  eliminationNotification: {
    backgroundColor: '#ff6b6b',
    borderColor: '#ff4757',
    borderWidth: 1,
  },
  lifelineNotification: {
    backgroundColor: '#ffa502',
    borderColor: '#ff9500',
    borderWidth: 1,
  },
  notificationText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default MemoryGameScreen;