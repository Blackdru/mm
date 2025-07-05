import React, {createContext, useContext, useReducer, useEffect} from 'react';
import { socket } from '../config/socket';
import { useAuth } from './AuthContext';

const GameContext = createContext();

const initialState = {
  socket: socket,
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

  const initializeSocket = () => {
    if (socket.connected) {
      console.log('Socket already connected');
      return;
    }
    if (token) {
      console.log('Initializing socket with token');
      socket.auth = { token };
      socket.connect();
    } else {
      console.log('No token available for socket initialization');
    }
  };

  useEffect(() => {
    function onConnect() {
      console.log('Socket connected successfully');
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'connected' });
    }

    function onDisconnect(reason) {
      console.log('Socket disconnected:', reason);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    }

    function onConnectError(error) {
      console.error('Socket connection error:', error);
      dispatch({ type: 'SET_CONNECTION_STATUS', payload: 'disconnected' });
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && token) {
      initializeSocket();
    } else {
      socket.disconnect();
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    const onMatchmakingStatus = (data) => {
      console.log('🔍 Matchmaking status:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: data.status});
    };

    const onMatchmakingError = (data) => {
      console.error('❌ Matchmaking error:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'error'});
      dispatch({type: 'SET_ERROR', payload: data.message});
    };

    const onMatchFound = (data) => {
      console.log('🎮 Match found event received:', data);
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'found'});
      dispatch({type: 'SET_GAME_ID', payload: data.gameId});
      dispatch({type: 'SET_PLAYER_ID', payload: data.yourPlayerId});
      if (data.yourPlayerName) {
        dispatch({type: 'SET_PLAYER_NAME', payload: data.yourPlayerName});
      }
      if (data.players) {
        dispatch({type: 'UPDATE_PLAYERS', payload: data.players});
      }
    };

    const onGameRoomJoined = (data) => {
      console.log('🎮 Game room joined:', data);
      dispatch({type: 'SET_GAME_ID', payload: data.gameId});
    };

    const onGameStateUpdated = (gameState) => {
      console.log('🎲 Game state updated:', gameState);
      dispatch({type: 'UPDATE_GAME_STATE', payload: gameState});
    };

    const onGameError = (data) => {
      console.error('❌ Game error:', data);
      dispatch({type: 'SET_ERROR', payload: data.message});
    };

    const onServerError = (data) => {
      console.error('❌ Server error:', data);
      dispatch({type: 'SET_ERROR', payload: data.message});
    };

    socket.on('matchmakingStatus', onMatchmakingStatus);
    socket.on('matchmakingError', onMatchmakingError);
    socket.on('matchFound', onMatchFound);
    socket.on('gameRoomJoined', onGameRoomJoined);
    socket.on('gameStateUpdated', onGameStateUpdated);
    socket.on('gameError', onGameError);
    socket.on('serverError', onServerError);

    return () => {
      socket.off('matchmakingStatus', onMatchmakingStatus);
      socket.off('matchmakingError', onMatchmakingError);
      socket.off('matchFound', onMatchFound);
      socket.off('gameRoomJoined', onGameRoomJoined);
      socket.off('gameStateUpdated', onGameError);
      socket.off('gameError', onGameError);
      socket.off('serverError', onServerError);
    };
  }, []);

  const joinMatchmaking = (gameType, maxPlayers, entryFee) => {
    if (state.socket && state.connectionStatus === 'connected') {
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'searching'});
      dispatch({type: 'CLEAR_ERROR'});
      state.socket.emit('joinMatchmaking', {
        gameType,
        maxPlayers,
        entryFee
      });
    } else {
      console.log('❌ Cannot join matchmaking - socket not connected');
    }
  };

  const leaveMatchmaking = () => {
    if (state.socket) {
      state.socket.emit('leaveMatchmaking');
      dispatch({type: 'SET_MATCHMAKING_STATUS', payload: 'idle'});
    }
  };

  const joinGameRoom = (gameId) => {
    if (state.socket && gameId) {
      state.socket.emit('joinGameRoom', { gameId });
    }
  };

  const rollDice = () => {
    if (state.socket && state.gameId) {
      state.socket.emit('rollDice', { gameId: state.gameId });
    }
  };

  const movePiece = (pieceId) => {
    if (state.socket && state.gameId) {
      state.socket.emit('movePiece', {
        gameId: state.gameId,
        pieceId
      });
    }
  };

  const selectCard = (position) => {
    if (state.socket && state.gameId) {
      state.socket.emit('selectCard', {
        gameId: state.gameId,
        position
      });
    }
  };

  const resetGame = () => {
    dispatch({type: 'RESET_GAME'});
  };

  const clearError = () => {
    dispatch({type: 'CLEAR_ERROR'});
  };

  const cleanupGameState = () => {
    dispatch({type: 'SET_GAME_ID', payload: null});
    dispatch({type: 'SET_PLAYER_ID', payload: null});
    dispatch({type: 'UPDATE_PLAYERS', payload: {}});
    dispatch({type: 'SET_WINNER', payload: null});
    dispatch({type: 'UPDATE_GAME_STATE', payload: { gameStatus: 'waiting' }});
    dispatch({type: 'CLEAR_ERROR'});
  };

  const forceResetMatchmaking = () => {
    if (state.socket && state.socket.connected && state.matchmakingStatus !== 'searching') {
      state.socket.emit('leaveMatchmaking');
    }
    dispatch({type: 'FORCE_RESET_TO_IDLE'});
  };

  const cleanupAfterGameEnd = () => {
    if (state.socket && state.socket.connected) {
      state.socket.emit('leaveMatchmaking');
    }
    dispatch({type: 'FORCE_RESET_TO_IDLE'});
  };

  const resetToIdle = () => {
    if (state.socket && state.socket.connected) {
      state.socket.emit('leaveMatchmaking');
    }
    dispatch({type: 'FORCE_RESET_TO_IDLE'});
  };

  return (
    <GameContext.Provider value={{
      ...state,
      initializeSocket,
      joinMatchmaking,
      leaveMatchmaking,
      joinGameRoom,
      rollDice,
      movePiece,
      selectCard,
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
