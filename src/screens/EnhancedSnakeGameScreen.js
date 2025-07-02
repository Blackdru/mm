import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  SafeAreaView,
  StatusBar 
} from 'react-native';
import { socket } from '../config/socket';
import { gameStyles } from '../styles/gameStyles';
import EnhancedSnakeBoard from '../components/EnhancedSnakeBoard';
import EnhancedDiceComponent from '../components/EnhancedDiceComponent';
import PlayersList from '../components/PlayersList';
import GameControls from '../components/GameControls';
import EmotePanel from '../components/EmotePanel';
import GameMessages from '../components/GameMessages';
import { useGame } from '../context/GameContext';

export default function EnhancedSnakeGameScreen({ route, navigation }) {
  const { gameId, playerName } = route.params;
  const { cleanupAfterGameEnd } = useGame();
  
  // Game state
  const [players, setPlayers] = useState([]);
  const [currentPlayer, setCurrentPlayer] = useState(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [lastRoll, setLastRoll] = useState(null);
  const [lastMove, setLastMove] = useState(null);
  const [winner, setWinner] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMessage, setCurrentMessage] = useState('');
  const [emoteMessage, setEmoteMessage] = useState(null);

  const myId = socket.id;
  const isMyTurn = currentPlayer?.id === myId;
  const isRoomOwner = players.length > 0 && players[0].id === myId;

  // Socket event handlers
  useEffect(() => {
    const handleError = (errorData) => {
      setError(errorData.message);
      setTimeout(() => setError(null), 5000);
    };

    const handlePlayerJoined = ({ players: updatedPlayers, gameState }) => {
      setPlayers(updatedPlayers);
      setGameStarted(gameState.started);
      setCurrentMessage(`${updatedPlayers[updatedPlayers.length - 1].username} joined the game!`);
      setIsLoading(false);
    };

    const handleRoomJoined = ({ gameId: joinedGameId, players: updatedPlayers, gameState }) => {
      setPlayers(updatedPlayers);
      setGameStarted(gameState.started);
      setIsLoading(false);
      setCurrentMessage('Successfully joined the game!');
    };

    const handleGameStarted = ({ players: updatedPlayers, currentPlayer: current }) => {
      setPlayers(updatedPlayers);
      setCurrentPlayer(current);
      setGameStarted(true);
      setWinner(null);
      setCurrentMessage('Game started! Let the fun begin!');
    };

    const handleDiceRolled = ({ playerId, playerName, value, oldPosition, newPosition, event }) => {
      setLastRoll({ playerId, value, playerName });
      setLastMove({ playerId, oldPosition, newPosition, event });
      
      if (event) {
        const eventType = event.type === 'snake' ? 'Snake' : 'Ladder';
        setCurrentMessage(`${playerName} hit a ${eventType.toLowerCase()}!`);
      }
    };

    const handleTurnChanged = ({ currentPlayer: newCurrentPlayer, players: updatedPlayers }) => {
      setCurrentPlayer(newCurrentPlayer);
      setPlayers(updatedPlayers);
      setLastRoll(null);
    };

    const handleGameWon = ({ winner: gameWinner, players: updatedPlayers }) => {
      setWinner(gameWinner);
      setPlayers(updatedPlayers);
      setGameStarted(false);
      setCurrentPlayer(null);
      
      // Show winner alert and reset matchmaking state
      setTimeout(() => {
        Alert.alert(
          'Game Over!',
          `🎉 ${gameWinner.username} wins!`,
          [
            { 
              text: 'Back to Menu', 
              onPress: () => {
                // Reset matchmaking state to idle for next game
                cleanupAfterGameEnd();
                navigation.navigate('Home');
              }
            }
          ]
        );
      }, 1000);
    };

    const handlePlayerLeft = ({ leftPlayer, players: updatedPlayers, currentPlayer: newCurrentPlayer }) => {
      setPlayers(updatedPlayers);
      setCurrentPlayer(newCurrentPlayer);
      setCurrentMessage(`${leftPlayer.username} left the game`);
      
      if (updatedPlayers.length === 0) {
        navigation.goBack();
      }
    };

    const handleGameReset = ({ players: updatedPlayers, gameState }) => {
      setPlayers(updatedPlayers);
      setGameStarted(false);
      setCurrentPlayer(null);
      setWinner(null);
      setLastRoll(null);
      setLastMove(null);
      setCurrentMessage('Game has been reset!');
    };

    const handleEmoteReceived = ({ from, emote, playerId }) => {
      setEmoteMessage({ from, emote, playerId });
    };

    // Register event listeners with snakes_ prefix
    socket.on('snakes_error', handleError);
    socket.on('snakes_playerJoined', handlePlayerJoined);
    socket.on('snakes_roomJoined', handleRoomJoined);
    socket.on('snakes_gameStarted', handleGameStarted);
    socket.on('snakes_diceRolled', handleDiceRolled);
    socket.on('snakes_turnChanged', handleTurnChanged);
    socket.on('snakes_gameWon', handleGameWon);
    socket.on('snakes_playerLeft', handlePlayerLeft);
    socket.on('snakes_gameReset', handleGameReset);
    socket.on('snakes_emoteReceived', handleEmoteReceived);

    // Join game room on mount
    socket.emit('joinGameRoom', { gameId });

    // Cleanup on unmount
    return () => {
      console.log('🧹 EnhancedSnakeGameScreen component unmounting, cleaning up...');
      
      // Emit leave game event
      if (socket && socket.connected) {
        socket.emit('snakes_leaveRoom', { gameId });
      }
      
      socket.off('snakes_error', handleError);
      socket.off('snakes_playerJoined', handlePlayerJoined);
      socket.off('snakes_roomJoined', handleRoomJoined);
      socket.off('snakes_gameStarted', handleGameStarted);
      socket.off('snakes_diceRolled', handleDiceRolled);
      socket.off('snakes_turnChanged', handleTurnChanged);
      socket.off('snakes_gameWon', handleGameWon);
      socket.off('snakes_playerLeft', handlePlayerLeft);
      socket.off('snakes_gameReset', handleGameReset);
      socket.off('snakes_emoteReceived', handleEmoteReceived);
      
      // Clean up game state but preserve matchmaking queue
      cleanupAfterGameEnd();
    };
  }, [gameId, playerName, navigation, cleanupAfterGameEnd]);

  // Clear messages after timeout
  useEffect(() => {
    if (currentMessage) {
      const timer = setTimeout(() => setCurrentMessage(''), 4000);
      return () => clearTimeout(timer);
    }
  }, [currentMessage]);

  useEffect(() => {
    if (emoteMessage) {
      const timer = setTimeout(() => setEmoteMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [emoteMessage]);

  // Game actions
  const handleRollDice = useCallback(() => {
    if (!isMyTurn || winner) return;
    socket.emit('snakes_rollDice', { gameId });
  }, [isMyTurn, winner, gameId]);

  const handleStartGame = useCallback(() => {
    socket.emit('snakes_startGame', { gameId });
  }, [gameId]);

  const handleResetGame = useCallback(() => {
    Alert.alert(
      'Reset Game',
      'Are you sure you want to reset the game? All progress will be lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => socket.emit('snakes_resetGame', { gameId })
        }
      ]
    );
  }, [gameId]);

  const handleLeaveRoom = useCallback(() => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this game?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            socket.emit('snakes_leaveRoom', { gameId });
            // Reset matchmaking state to idle when leaving mid-game
            cleanupAfterGameEnd();
            navigation.goBack();
          }
        }
      ]
    );
  }, [gameId, navigation, cleanupAfterGameEnd]);

  const handleSendEmote = useCallback((emote) => {
    socket.emit('snakes_sendEmote', { gameId, emote });
  }, [gameId]);

  if (isLoading) {
    return (
      <View style={gameStyles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={gameStyles.loadingText}>Joining game...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={gameStyles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2c3e50" />
      
      {/* Header */}
      <View style={gameStyles.header}>
        <View>
          <Text style={gameStyles.headerTitle}>Snakes & Ladders</Text>
          <Text style={gameStyles.roomId}>Game: {gameId}</Text>
        </View>
        <Text style={gameStyles.headerTitle}>
          {players.length}/4 Players
        </Text>
      </View>

      {/* Error Display */}
      {error && (
        <View style={gameStyles.errorContainer}>
          <Text style={gameStyles.errorText}>{error}</Text>
        </View>
      )}

      {/* Game Area */}
      <View style={gameStyles.gameArea}>
        {/* Game Board */}
        <EnhancedSnakeBoard 
          players={players}
          currentPlayer={currentPlayer}
          lastMove={lastMove}
        />

        {/* Players List */}
        <PlayersList 
          players={players}
          currentPlayer={currentPlayer}
          gameStarted={gameStarted}
          myId={myId}
        />

        {/* Game Messages */}
        <GameMessages
          winner={winner}
          lastMove={lastMove}
          currentMessage={currentMessage}
          emoteMessage={emoteMessage}
        />

        {/* Controls */}
        <View style={gameStyles.controlsContainer}>
          {gameStarted && !winner && (
            <EnhancedDiceComponent
              isMyTurn={isMyTurn}
              onRoll={handleRollDice}
              lastRoll={lastRoll}
              currentPlayerName={currentPlayer?.username}
              disabled={winner !== null}
            />
          )}

          {/* Emote Panel */}
          {gameStarted && (
            <EmotePanel 
              onSendEmote={handleSendEmote}
              disabled={winner !== null}
            />
          )}

          {/* Game Controls */}
          <GameControls
            gameStarted={gameStarted}
            isRoomOwner={isRoomOwner}
            onStartGame={handleStartGame}
            onResetGame={handleResetGame}
            onLeaveRoom={handleLeaveRoom}
            playersCount={players.length}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}