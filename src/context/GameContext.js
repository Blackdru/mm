import React, {createContext, useContext, useReducer, useEffect} from 'react';
import io from 'socket.io-client';
import config from '../config/config';

const GameContext = createContext();

const initialState = {
  socket: null,
  gameId: null,
  playerId: null,
  players: {},
  currentTurn: 0,
  gameBoard: initializeBoard(),
  diceValue: 0,
  gameStatus: 'waiting', // waiting, playing, finished
  winner: null,
  playerPositions: {},
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
    case 'SET_GAME_ID':
      return {...state, gameId: action.payload};
    case 'SET_PLAYER_ID':
      return {...state, playerId: action.payload};
    case 'UPDATE_PLAYERS':
      return {...state, players: action.payload};
    case 'UPDATE_GAME_STATE':
      return {...state, ...action.payload};
    case 'ROLL_DICE':
      return {...state, diceValue: action.payload};
    case 'MOVE_PIECE':
      const newBoard = {...state.gameBoard};
      // Implement piece movement logic
      return {...state, gameBoard: newBoard};
    case 'SET_WINNER':
      return {...state, winner: action.payload, gameStatus: 'finished'};
    default:
      return state;
  }
};

export const GameProvider = ({children}) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    const socket = io(config.SERVER_URL, config.SOCKET_CONFIG);
    
    dispatch({type: 'SET_SOCKET', payload: socket});

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
    });

    socket.on('gameJoined', (data) => {
      dispatch({type: 'SET_GAME_ID', payload: data.gameId});
      dispatch({type: 'SET_PLAYER_ID', payload: data.playerId});
    });

    socket.on('playersUpdated', (players) => {
      dispatch({type: 'UPDATE_PLAYERS', payload: players});
    });

    socket.on('gameStateUpdated', (gameState) => {
      dispatch({type: 'UPDATE_GAME_STATE', payload: gameState});
    });

    socket.on('diceRolled', (data) => {
      dispatch({type: 'ROLL_DICE', payload: data.value});
    });

    socket.on('error', (error) => {
      console.error('Game error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const joinGame = (playerCount, paymentConfirmed) => {
    if (state.socket && paymentConfirmed) {
      state.socket.emit('joinGame', {playerCount});
    }
  };

  const rollDice = () => {
    if (state.socket) {
      state.socket.emit('rollDice', {gameId: state.gameId});
    }
  };

  const movePiece = (pieceId) => {
    if (state.socket) {
      state.socket.emit('movePiece', {
        gameId: state.gameId,
        pieceId
      });
    }
  };

  return (
    <GameContext.Provider value={{
      ...state,
      joinGame,
      rollDice,
      movePiece
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
