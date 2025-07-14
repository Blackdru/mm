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
  '🐉', // dragon
  '🚀', // rocket
  '🍩', // donut
  '🎧', // headphones
  '🧊', // ice cube
  '🧬', // DNA
  '🦾', // robot arm
  '🦉', // owl
  '⚡', // lightning
  '🧨', // firecracker
  '🪄', // magic wand
  '🎸', // guitar
  '🧿', // nazar (evil eye)
  '🪙', // coin
  '🔮'  // crystal ball
];

// Brain icon for card backs
const BRAIN_ICON = '🧠';

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

  // Improved grid layout for 30 cards (5 columns x 6 rows) with better spacing
  const getCardGridPosition = (index) => {
    const cols = 5;
    const rows = 6;
    const containerWidth = width - 24; // Reduced padding to match container
    const cardSpacing = 5; // Reduced spacing for better fit
    const cardWidth = (containerWidth - (cardSpacing * (cols + 1))) / cols;
    const cardHeight = cardWidth; // Square cards for better fit
    
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
    const { positions, playerId: matchingPlayer, newScore, matchedPairs } = data;
    
    // Update score for the matching player immediately
    if (matchingPlayer && newScore !== undefined) {
      setScores(prev => ({
        ...prev,
        [matchingPlayer]: newScore
      }));
    }

    // Keep cards visible for 700ms before marking as matched
    setTimeout(() => {
      // Update matched cards after delay
      setMatchedCards(prev => [...prev, ...positions]);
      
      // Update game board to mark cards as matched
      setGameBoard(prev => 
        prev.map((card, index) => 
          positions.includes(index) ? { ...card, isMatched: true } : card
        )
      );

      // Clear flipped cards after delay
      setFlippedCards([]);
      setSelectedCards([]);
      
      // Reset timer state - player gets another turn so timer will restart
      setTurnTimeRemaining(0);
      setLocalTimerActive(false);
    }, 700);
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
    
    // Flip back after backend has processed the delay
    positions.forEach(pos => animateCardFlip(pos, true));
    
    // Update game board to hide cards
    setGameBoard(prev => 
      prev.map((card, index) => 
        positions.includes(index) ? { ...card, isFlipped: false } : card
      )
    );

    // Clear tracking and processing state
    setFlippedCards([]);
    setSelectedCards([]);
    setIsProcessingCard(false);
    
    // Reset timer state - turn is changing
    setTurnTimeRemaining(0);
    setLocalTimerActive(false);
  };

  const handleCardsNoMatch = (data) => {
    console.log('Cards no match:', data);
    const { positions } = data;
    
    // Keep cards visible for now - backend will send mismatch event after delay
    // This event just indicates no match was found, cards stay flipped for 700ms
    console.log('Cards will flip back after 700ms delay');
    
    // Clear processing state but keep cards visible
    setIsProcessingCard(false);
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
    
    // Handle specific error codes
    if (data.code === 'CARD_SELECTION_FAILED') {
      // Revert optimistic UI updates for card selection errors
      if (data.position !== undefined) {
        setSelectedCards(prev => prev.filter(pos => pos !== data.position));
        setGameBoard(prev => prev.map((card, idx) => 
          idx === data.position ? { ...card, isFlipped: false } : card
        ));
      }
      setIsProcessingCard(false);
    }
    
    // Show user-friendly error message
    Alert.alert('Game Error', data.message || 'An error occurred during the game.');
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
    
    // Enhanced debouncing - 500ms minimum between clicks
    if (now - lastCardPressTime.current < 500) {
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
      Alert.alert('Connection Error', 'Not connected to server. Please check your internet connection.');
      return;
    }
    
    if (!isMyTurn || gameStatus !== 'playing') {
      console.log('Not your turn or game not playing');
      if (gameStatus === 'playing' && !isMyTurn) {
        Alert.alert('Wait Your Turn', 'Please wait for your turn to play.');
      }
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
      // Reset processing state after a longer delay to prevent rapid selections
      setTimeout(() => setIsProcessingCard(false), 1000);
    } else {
      console.log('Socket not connected, cannot select card');
      // Revert optimistic update
      setSelectedCards(prev => prev.filter(p => p !== position));
      setGameBoard(prev => prev.map((card, idx) => idx === position ? { ...card, isFlipped: false } : card));
      setIsProcessingCard(false);
      Alert.alert('Connection Error', 'Lost connection to server. Please try again.');
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
              {isFlipped ? card.symbol : BRAIN_ICON}
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
      {/* Compact Header */}
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
              const displayName = isMe ? 'You' : (player.name || player.playerName || `P${index + 1}`);
              
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

      {/* Compact Turn Indicator */}
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
          
          {/* Turn Timer */}
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

      {/* Compact Game Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={handleLeaveGame}
        >
          <Text style={styles.controlButtonText}>🚪 Leave</Text>
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
                <Text style={styles.gameReasonText}>
                  📋 {gameResults.reason}
                </Text>
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
    backgroundColor: '#1A1B23', // Lighter dark background for better daylight visibility
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // More visible background
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Stronger border
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00E5FF', // Brighter cyan for better visibility
    marginBottom: 2,
    textAlign: 'center',
    letterSpacing: 0.8,
    textShadowColor: 'rgba(0, 229, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: 10,
    color: '#C0C0D0', // Brighter subtitle for better readability
    marginBottom: 6,
    textAlign: 'center',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  
  // Prize pool - compact design
  prizePoolContainer: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)', // More visible background
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.5)', // Stronger border
    alignSelf: 'center',
  },
  prizePoolLabel: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFE55C', // Brighter gold
    marginBottom: 1,
    letterSpacing: 0.3,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  prizePoolAmount: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFE55C', // Brighter gold
    letterSpacing: 0.8,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Score cards - compact layout
  scoreContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
    gap: 8,
  },
  scoreCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // More visible background
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)', // Stronger border
    minHeight: 45,
    justifyContent: 'center',
  },
  myScoreCard: {
    backgroundColor: 'rgba(0, 229, 255, 0.18)', // Brighter background
    borderColor: '#00E5FF', // Brighter border
    borderWidth: 1.5,
    transform: [{ scale: 1.01 }],
  },
  eliminatedCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.06)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 1,
    opacity: 0.7,
  },
  scorePlayerName: {
    fontSize: 8,
    fontWeight: '600',
    color: '#F0F0F8', // Brighter text
    marginBottom: 2,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  myScorePlayerName: {
    color: '#00E5FF', // Brighter cyan
    fontWeight: '700',
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  myScoreText: {
    color: '#00E5FF', // Brighter cyan
    fontSize: 12,
  },
  lifelinesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    justifyContent: 'center',
    gap: 2,
  },
  heartIcon: {
    fontSize: 10,
  },
  activeHeart: {
    color: '#FF6B6B',
    opacity: 1,
  },
  inactiveHeart: {
    color: '#555',
    opacity: 0.2,
  },
  
  // Turn indicator - compact spacing
  turnIndicatorContainer: {
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  turnContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // More visible background
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Stronger border
  },
  myTurnContainer: {
    backgroundColor: 'rgba(0, 229, 255, 0.22)', // Brighter background
    borderColor: '#00E5FF', // Brighter border
    borderWidth: 1.5,
    transform: [{ scale: 1.01 }],
  },
  turnText: {
    fontSize: 12,
    color: '#F0F0F8', // Brighter text
    fontWeight: '600',
    letterSpacing: 0.3,
    flex: 1,
  },
  myTurnText: {
    color: '#00E5FF', // Brighter cyan
    fontSize: 13,
    fontWeight: '700',
  },
  turnTimerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // More visible background
    borderRadius: 10,
    minWidth: 50,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Stronger border
  },
  turnTimerText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#00FF9F', // Brighter green
    textAlign: 'center',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 255, 159, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  turnTimerPlaceholder: {
    fontSize: 10,
    fontWeight: '600',
    color: '#A0A0B0', // Brighter placeholder
    textAlign: 'center',
  },
  urgentTimer: {
    color: '#FF8A8A', // Brighter red
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(255, 138, 138, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Game board - optimized dimensions
  gameBoard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    paddingHorizontal: 4,
  },
  gridContainer: {
    width: width - 24,
    height: (() => {
      const containerWidth = width - 24;
      const cardSpacing = 5;
      const cardWidth = (containerWidth - (cardSpacing * 6)) / 5;
      const cardHeight = cardWidth;
      return cardSpacing * 7 + cardHeight * 6;
    })(),
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)', // More visible background
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Stronger border
    padding: 6,
  },
  gridCard: {
    position: 'absolute',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // More visible background
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)', // Stronger border
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCard: {
    opacity: 0.5, // Slightly more visible when disabled
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  invisibleCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: '#00E5FF', // Brighter cyan
    backgroundColor: 'rgba(0, 229, 255, 0.22)', // Brighter background
    transform: [{ scale: 1.05 }],
  },
  cardInner: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFront: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.15)', // More visible background
  },
  cardFlipped: {
    backgroundColor: 'rgba(0, 229, 255, 0.28)', // Brighter background
    borderColor: '#00E5FF', // Brighter border
    borderWidth: 2,
  },
  cardSymbol: {
    fontSize: 22,
    color: '#F0F0F8', // Brighter text
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  cardSymbolFlipped: {
    color: '#00E5FF', // Brighter cyan
    fontSize: 24,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 229, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  
  // Controls - compact positioning
  controls: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  controlButton: {
    backgroundColor: 'rgba(255, 138, 138, 0.22)', // Brighter background
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 16,
    minWidth: 100,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 138, 138, 0.6)', // Stronger border
  },
  controlButtonText: {
    color: '#FF8A8A', // Brighter red
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 138, 138, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  
  // Leaderboard modal - improved layout
  leaderboardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  leaderboardModal: {
    backgroundColor: 'rgba(26, 27, 35, 0.98)', // Lighter background
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)', // Brighter border
  },
  leaderboardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#00E5FF', // Brighter cyan
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 229, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  prizePoolDisplay: {
    backgroundColor: 'rgba(255, 215, 0, 0.18)', // More visible background
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.5)', // Stronger border
  },
  prizePoolDisplayText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFE55C', // Brighter gold
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  leaderboardList: {
    marginBottom: 16,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)', // More visible background
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)', // Stronger border
  },
  winnerItem: {
    backgroundColor: 'rgba(0, 229, 255, 0.15)', // Brighter background
    borderColor: '#00E5FF', // Brighter border
    borderWidth: 2,
    transform: [{ scale: 1.02 }],
  },
  rankContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 50,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F0F0F8', // Brighter text
    letterSpacing: 0.5,
  },
  crownIcon: {
    fontSize: 16,
    marginLeft: 4,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerNameText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F0F0F8', // Brighter text
    letterSpacing: 0.3,
  },
  winnerText: {
    color: '#00E5FF', // Brighter cyan
    fontWeight: '700',
  },
  playerScoreText: {
    fontSize: 12,
    color: '#A0A0B0',
    marginTop: 2,
    fontWeight: '500',
  },
  playerLifelinesText: {
    fontSize: 10,
    color: '#FFD700',
    marginTop: 2,
    fontWeight: '500',
  },
  winAmountContainer: {
    alignItems: 'flex-end',
  },
  winAmountText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  winnerAmountText: {
    color: '#00E5FF', // Brighter cyan
    fontSize: 16,
    fontWeight: '700',
  },
  
  // Timer components
  timerContainer: {
    alignItems: 'center',
    padding: 16,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFE55C', // Brighter gold
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(255, 215, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  timerBar: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  timerProgress: {
    height: '100%',
    backgroundColor: '#00E5FF', // Brighter cyan
    borderRadius: 3,
  },
  
  // Waiting screen
  waitingText: {
    fontSize: 16,
    color: '#F0F0F8', // Brighter text
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  startButton: {
    backgroundColor: '#00E5FF', // Brighter cyan
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 229, 255, 0.4)', // Brighter border
  },
  startButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  
  // Status indicators
  connectionStatus: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.3)',
    alignSelf: 'center',
  },
  connectionStatusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  gameReasonContainer: {
    backgroundColor: 'rgba(0, 229, 255, 0.22)', // Brighter background
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.4)', // Brighter border
  },
  gameReasonText: {
    color: '#00E5FF', // Brighter cyan
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  
  // Notifications
  notification: {
    position: 'absolute',
    top: 60,
    left: 12,
    right: 12,
    padding: 8,
    borderRadius: 8,
    zIndex: 999,
  },
  eliminationNotification: {
    backgroundColor: 'rgba(255, 107, 107, 0.95)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
    borderWidth: 1,
  },
  lifelineNotification: {
    backgroundColor: 'rgba(255, 165, 2, 0.95)',
    borderColor: 'rgba(255, 165, 2, 0.3)',
    borderWidth: 1,
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
});

export default MemoryGameScreen;