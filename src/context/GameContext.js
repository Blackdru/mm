import React, {createContext, useContext, useReducer, useEffect} from 'react';
import io from 'socket.io-client';
import config from '../config/config';
import {useAuth} from './AuthContext';

const GameContext = createContext();

const initialState = {
  socket: null,
  gameId: null,
  playerId: null,
  playerName: null,
  players: {},
  currentTurn: 0,
  gameBoard: initializeBoard(),
  diceValue: 0,
  gameStatus: 'waiting', // waiting, playing, finished
  winner: null,
  playerPositions: {},
  matchmakingStatus: 'idle', // idle, searching, found, error
  connectionStatus: 'disconnected', // connected, disconnected, connecting
  error: null,
};

function initializeBoard() {
  const board = {};
  const colors = ['red', 'blue', 'green', 'yellow'];
  
  colors.forEach(color => {
    board[color] = {
      home: [0, 1, 2, 3],
      safe: [],
      pieces: [
        {id: 0, position: 'home', homeIndex: 0},
        {id: 1, position: 'home', homeIndex: 1},
        {id: 2, position: 'home', homeIndex: 2},
        {id: 3, position: 'home', homeIndex: 3},
      ]
    };
  });
  
  return board;
}

const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_SOCKET':
      return {...state, socket: action.payload};
    case 'SET_CONNECTION_STATUS':
      return {...state, connectionStatus: action.payload};
    case 'SET_GAME_ID':
      return {...state, gameId: action.payload};
    case 'SET_PLAYER_ID':
      return {...state, playerId: action.payload};
    case 'SET_PLAYER_NAME':
      return {...state, playerName: action.payload};
    case 'UPDATE_PLAYERS':
      return {...state, players: action.payload};
    case 'UPDATE_GAME_STATE':
      return {...state, ...action.payload};
    case 'SET_MATCHMAKING_STATUS':
      return {...state, matchmakingStatus: action.payload};
    case 'ROLL_DICE':
      return {...state, diceValue: action.payload};
    case 'MOVE_PIECE':
      const newBoard = {...state.gameBoard};
      // Implement piece movement logic
      return {...state, gameBoard: newBoard};
    case 'SET_WINNER':
      return {...state, winner: action.payload, gameStatus: 'finished'};
    case 'SET_ERROR':
      return {...state, error: action.payload};
    case 'CLEAR_ERROR':
      return {...state, error: null};
    case 'RESET_GAME':
      return {
        ...initialState, 
        socket: state.socket, 
        connectionStatus: state.connectionStatus,
        matchmakingStatus: 'idle' // Reset matchmaking status
      };
    case 'FORCE_RESET_TO_IDLE':
      return {
        ...state,
        matchmakingStatus: 'idle',
        gameId: null,
        playerId: null,
        players: {},
        winner: null,
        gameStatus: 'waiting',
        error: null
      };
    default:
      return state;
  }
};

export const GameProvider = ({children}) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);
  const {token, isAuthenticated, user} = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !token) {
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
      return;
    }

    console.log('Initializing socket connection...');
    dispatch({type: 'SET_CONNECTION_STATUS', payload: 'connecting'});
    
    const socket = io(config.SERVER_URL, {
      ...config.SOCKET_CONFIG,
      auth: {
        token: token
      }
    });
    
    dispatch({type: 'SET_SOCKET', payload: socket});
    if (user?.name) {
      dispatch({type: 'SET_PLAYER_NAME', payload: user.name});
    }

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Connected to game server');
      setTimeout(() => {
        dispatch({type: 'SET_CONNECTION_STATUS', payload: 'connected'});
        dispatch({type: 'CLEAR_ERROR'});
      }, 0);
    });

    socket.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
      setTimeout(() => {
        dispatch({type: 'SET_PLAYER_ID', payload: data.userId});
        if (data.userName) {
          dispatch({type: 'SET_PLAYER_NAME', payload: data.userName});
          console.log('👤 Player name set from server:', data.userName);
        }
        console.log('📋 Connection data received:', {
          userId: data.userId,
          userName: data.userName,
          userPhone: data.userPhone
        });
      }, 0);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      setTimeout(() => {
        dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
      }, 0);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setTimeout(() => {
        dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
        dispatch({type: 'SET_ERROR', payload: 'Failed to connect to game server'});
      }, 0);
    });

    // Matchmaking events
    socket.on('matchmakingStatus', (data) => {
      console.log('🔍 Matchmaking status:', data);
      setTimeout(() => {
        dispatch({type: 'SET_MATCHMAKING_STATUS', payload: data.status});
      }, 0);
    });

    socket.on('matchmakingError', (data) => {
      console.error('❌ Matchmaking error:', data);
      setTimeout(() => {
        dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'error'});
        dispatch({type: 'SET_ERROR', payload: data.message});
      }, 0);
    });

    socket.on('matchFound', (data) => {
      console.log('🎮 Match found event received:', data);
      console.log('🔍 Current matchmaking status:', state.matchmakingStatus);
      
      // Process match found regardless of current status to fix the issue
      console.log('✅ Processing match found event...');
      
      // Use setTimeout to avoid setState during render
      setTimeout(() => {
        dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'found'});
        dispatch({type: 'SET_GAME_ID', payload: data.gameId});
        dispatch({type: 'SET_PLAYER_ID', payload: data.yourPlayerId});
        if (data.yourPlayerName) {
          dispatch({type: 'SET_PLAYER_NAME', payload: data.yourPlayerName});
          console.log('👤 Player name updated from matchFound:', data.yourPlayerName);
        }
        if (data.players) {
          dispatch({type: 'UPDATE_PLAYERS', payload: data.players});
          console.log('👥 Players data received:', data.players);
        }
        console.log('🎯 Match details:', {
          gameId: data.gameId,
          gameType: data.gameType,
          yourPlayerId: data.yourPlayerId,
          yourPlayerName: data.yourPlayerName,
          playersCount: data.players?.length || 0
        });
      }, 0);
    });

    // Game room events
    socket.on('gameRoomJoined', (data) => {
      console.log('🎮 Game room joined:', data);
      setTimeout(() => {
        dispatch({type: 'SET_GAME_ID', payload: data.gameId});
      }, 0);
    });

    // Game state events
    socket.on('gameStateUpdated', (gameState) => {
      console.log('🎲 Game state updated:', gameState);
      setTimeout(() => {
        dispatch({type: 'UPDATE_GAME_STATE', payload: gameState});
      }, 0);
    });

    // Error events
    socket.on('gameError', (data) => {
      console.error('❌ Game error:', data);
      setTimeout(() => {
        dispatch({type: 'SET_ERROR', payload: data.message});
      }, 0);
    });

    socket.on('serverError', (data) => {
      console.error('❌ Server error:', data);
      setTimeout(() => {
        dispatch({type: 'SET_ERROR', payload: data.message});
      }, 0);
    });

    return () => {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
    };
  }, [isAuthenticated, token, user?.name]);

  // Matchmaking functions
  const joinMatchmaking = (gameType, maxPlayers, entryFee) => {
    console.log('🎯 joinMatchmaking called with:', { gameType, maxPlayers, entryFee });
    console.log('🔍 Current state:', {
      socketConnected: state.socket?.connected,
      connectionStatus: state.connectionStatus,
      matchmakingStatus: state.matchmakingStatus,
      gameId: state.gameId,
      playerId: state.playerId
    });
    
    if (state.socket && state.connectionStatus === 'connected') {
      console.log('🎯 Starting new matchmaking - clearing previous state');
      // Clear any previous game state before starting new matchmaking
      dispatch({type: 'SET_GAME_ID', payload: null});
      dispatch({type: 'SET_PLAYER_ID', payload: null});
      dispatch({type: 'UPDATE_PLAYERS', payload: {}});
      dispatch({type: 'SET_WINNER', payload: null});
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'searching'});
      dispatch({type: 'CLEAR_ERROR'});
      
      console.log('📤 Emitting joinMatchmaking to server');
      state.socket.emit('joinMatchmaking', {
        gameType,
        maxPlayers,
        entryFee
      });
    } else {
      console.log('❌ Cannot join matchmaking - socket not connected or connection status not ready');
      console.log('Socket:', state.socket?.connected, 'Connection status:', state.connectionStatus);
    }
  };

  const leaveMatchmaking = () => {
    if (state.socket) {
      state.socket.emit('leaveMatchmaking');
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'idle'});
      dispatch({type: 'SET_GAME_ID', payload: null});
      dispatch({type: 'UPDATE_PLAYERS', payload: {}});
    }
  };

  // Game room functions
  const joinGameRoom = (gameId) => {
    if (state.socket && gameId) {
      state.socket.emit('joinGameRoom', { gameId });
    }
  };

  // Game action functions
  const rollDice = () => {
    if (state.socket && state.gameId) {
      dispatch({type: 'CLEAR_ERROR'});
      state.socket.emit('rollDice', { gameId: state.gameId });
    }
  };

  const movePiece = (pieceId) => {
    if (state.socket && state.gameId) {
      dispatch({type: 'CLEAR_ERROR'});
      state.socket.emit('movePiece', {
        gameId: state.gameId,
        pieceId
      });
    }
  };

  const selectCard = (position) => {
    if (state.socket && state.gameId) {
      dispatch({type: 'CLEAR_ERROR'});
      state.socket.emit('selectCard', {
        gameId: state.gameId,
        position
      });
    }
  };

  // Utility functions
  const resetGame = () => {
    dispatch({type: 'RESET_GAME'});
  };

  const clearError = () => {
    dispatch({type: 'CLEAR_ERROR'});
  };

  const cleanupGameState = () => {
    console.log('🧹 Cleaning up game state (preserving matchmaking)...');
    // Only clean game state, not matchmaking state
    dispatch({type: 'SET_GAME_ID', payload: null});
    dispatch({type: 'SET_PLAYER_ID', payload: null});
    dispatch({type: 'UPDATE_PLAYERS', payload: {}});
    dispatch({type: 'SET_WINNER', payload: null});
    dispatch({type: 'UPDATE_GAME_STATE', payload: { gameStatus: 'waiting' }});
    dispatch({type: 'CLEAR_ERROR'});
  };

  const forceResetMatchmaking = () => {
    console.log('🔄 Force resetting matchmaking state...');
    // Only reset matchmaking when explicitly requested (after game completion)
    if (state.socket && state.socket.connected && state.matchmakingStatus !== 'searching') {
      state.socket.emit('leaveMatchmaking');
    }
    dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'idle'});
    dispatch({type: 'SET_GAME_ID', payload: null});
    dispatch({type: 'SET_PLAYER_ID', payload: null});
    dispatch({type: 'UPDATE_PLAYERS', payload: {}});
    dispatch({type: 'SET_WINNER', payload: null});
    dispatch({type: 'UPDATE_GAME_STATE', payload: { gameStatus: 'waiting' }});
    dispatch({type: 'CLEAR_ERROR'});
  };

  const cleanupAfterGameEnd = () => {
    console.log('🧹 Cleaning up after game end...');
    // Complete cleanup only after game is finished
    if (state.socket && state.socket.connected) {
      state.socket.emit('leaveMatchmaking');
    }
    dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'idle'});
    dispatch({type: 'SET_GAME_ID', payload: null});
    dispatch({type: 'SET_PLAYER_ID', payload: null});
    dispatch({type: 'UPDATE_PLAYERS', payload: {}});
    dispatch({type: 'SET_WINNER', payload: null});
    dispatch({type: 'UPDATE_GAME_STATE', payload: { gameStatus: 'waiting' }});
    dispatch({type: 'CLEAR_ERROR'});
  };

  const resetToIdle = () => {
    console.log('🔄 Resetting to idle state...');
    console.log('🔍 Current state before reset:', {
      matchmakingStatus: state.matchmakingStatus,
      gameId: state.gameId,
      playerId: state.playerId,
      connectionStatus: state.connectionStatus
    });
    
    // Force leave matchmaking to ensure backend cleanup
    if (state.socket && state.socket.connected) {
      console.log('📤 Emitting leaveMatchmaking to server during reset');
      state.socket.emit('leaveMatchmaking');
    }
    
    // Use the new force reset action
    dispatch({type: 'FORCE_RESET_TO_IDLE'});
    
    console.log('✅ Reset to idle completed');
  };

  return (
    <GameContext.Provider value={{
      ...state,
      // Matchmaking
      joinMatchmaking,
      leaveMatchmaking,
      // Game room
      joinGameRoom,
      // Game actions
      rollDice,
      movePiece,
      selectCard,
      // Utilities
      resetGame,
      clearError,
      cleanupGameState,
      forceResetMatchmaking,
      resetToIdle,
      cleanupAfterGameEnd
    }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within GameProvider');
  }
  return context;
};
