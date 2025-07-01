import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

export default function GameControls({ 
  gameStarted, 
  isRoomOwner, 
  onStartGame, 
  onResetGame, 
  onLeaveRoom,
  playersCount 
}) {
  return (
    <View style={gameStyles.buttonContainer}>
      {!gameStarted && isRoomOwner && (
        <TouchableOpacity
          style={[gameStyles.button, playersCount < 2 && gameStyles.buttonDisabled]}
          onPress={onStartGame}
          disabled={playersCount < 2}
        >
          <Text style={gameStyles.buttonText}>
            Start Game ({playersCount}/4)
          </Text>
        </TouchableOpacity>
      )}

      {gameStarted && isRoomOwner && (
        <TouchableOpacity
          style={[gameStyles.button, gameStyles.buttonSecondary]}
          onPress={onResetGame}
        >
          <Text style={gameStyles.buttonText}>Reset Game</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[gameStyles.button, gameStyles.buttonDanger]}
        onPress={onLeaveRoom}
      >
        <Text style={gameStyles.buttonText}>Leave Room</Text>
      </TouchableOpacity>
    </View>
  );
}