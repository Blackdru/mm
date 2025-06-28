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
      return {...initialState, socket: state.socket, connectionStatus: state.connectionStatus};
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
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'connected'});
      dispatch({type: 'CLEAR_ERROR'});
    });

    socket.on('connected', (data) => {
      console.log('✅ Server confirmed connection:', data);
      dispatch({type: 'SET_PLAYER_ID', payload: data.userId});
      if (data.userName) {
        dispatch({type: 'SET_PLAYER_NAME', payload: data.userName});
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason);
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
      dispatch({type: 'SET_ERROR', payload: 'Failed to connect to game server'});
    });

    // Matchmaking events
    socket.on('matchmakingStatus', (data) => {
      console.log('🔍 Matchmaking status:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: data.status});
    });

    socket.on('matchmakingError', (data) => {
      console.error('❌ Matchmaking error:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'error'});
      dispatch({type: 'SET_ERROR', payload: data.message});
    });

    socket.on('matchFound', (data) => {
      console.log('🎮 Match found:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'found'});
      dispatch({type: 'SET_GAME_ID', payload: data.gameId});
      dispatch({type: 'SET_PLAYER_ID', payload: data.yourPlayerId});
      if (data.players) {
        dispatch({type: 'UPDATE_PLAYERS', payload: data.players});
      }
    });

    // Game room events
    socket.on('gameRoomJoined', (data) => {
      console.log('🎮 Game room joined:', data);
      dispatch({type: 'SET_GAME_ID', payload: data.gameId});
    });

    // Game state events
    socket.on('gameStateUpdated', (gameState) => {
      console.log('🎲 Game state updated:', gameState);
      dispatch({type: 'UPDATE_GAME_STATE', payload: gameState});
    });

    // Error events
    socket.on('gameError', (data) => {
      console.error('❌ Game error:', data);
      dispatch({type: 'SET_ERROR', payload: data.message});
    });

    socket.on('serverError', (data) => {
      console.error('❌ Server error:', data);
      dispatch({type: 'SET_ERROR', payload: data.message});
    });

    return () => {
      console.log('🔌 Disconnecting socket...');
      socket.disconnect();
      dispatch({type: 'SET_CONNECTION_STATUS', payload: 'disconnected'});
    };
  }, [isAuthenticated, token, user?.name]);

  // Matchmaking functions
  const joinMatchmaking = (gameType, maxPlayers, entryFee) => {
    if (state.socket && state.connectionStatus === 'connected') {
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'searching'});
      dispatch({type: 'CLEAR_ERROR'});
      state.socket.emit('joinMatchmaking', {
        gameType,
        maxPlayers,
        entryFee
      });
    }
  };

  const leaveMatchmaking = () => {
    if (state.socket) {
      state.socket.emit('leaveMatchmaking');
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'idle'});
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
      clearError
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
