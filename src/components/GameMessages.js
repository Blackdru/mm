import React, { useEffect, useState } from 'react';
import { View, Text, Animated } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

export default function GameMessages({ 
  winner, 
  lastMove, 
  currentMessage,
  emoteMessage 
}) {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (currentMessage || emoteMessage) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(3000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [currentMessage, emoteMessage]);

  if (winner) {
    return (
      <View style={[gameStyles.messageContainer, gameStyles.winnerContainer]}>
        <Text style={gameStyles.winnerText}>
          🏆 {winner.username} Wins! 🏆
        </Text>
        <Text style={gameStyles.messageText}>
          Congratulations on reaching position 100!
        </Text>
      </View>
    );
  }

  if (lastMove?.event) {
    const { event, newPosition, oldPosition } = lastMove;
    const isSnake = event.type === 'snake';
    
    return (
      <View style={gameStyles.messageContainer}>
        <Text style={gameStyles.messageText}>
          {isSnake ? '🐍 Snake bite!' : '🪜 Ladder climb!'}
        </Text>
        <Text style={gameStyles.messageText}>
          Moved from {event.from} to {event.to}
        </Text>
      </View>
    );
  }

  if (currentMessage || emoteMessage) {
    return (
      <Animated.View 
        style={[gameStyles.messageContainer, { opacity: fadeAnim }]}
      >
        <Text style={gameStyles.messageText}>
          {currentMessage || `${emoteMessage.from} sent ${emoteMessage.emote}`}
        </Text>
      </Animated.View>
    );
  }

  return null;
}