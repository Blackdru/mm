import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { gameStyles } from '../styles/gameStyles';

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function EnhancedDiceComponent({ 
  isMyTurn, 
  onRoll, 
  lastRoll, 
  currentPlayerName,
  disabled = false 
}) {
  const [isRolling, setIsRolling] = useState(false);
  const [animatedValue] = useState(new Animated.Value(1));

  useEffect(() => {
    if (lastRoll) {
      setIsRolling(true);
      // Animate dice roll
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.3,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsRolling(false);
      });
    }
  }, [lastRoll]);

  const handleRoll = () => {
    if (!isMyTurn || disabled || isRolling) return;
    setIsRolling(true);
    onRoll();
  };

  const getButtonStyle = () => {
    if (disabled || !isMyTurn) {
      return [gameStyles.diceButton, gameStyles.diceButtonDisabled];
    }
    return gameStyles.diceButton;
  };

  const getButtonText = () => {
    if (isRolling) return '🎲 Rolling...';
    if (!isMyTurn) return `${currentPlayerName}'s Turn`;
    if (disabled) return 'Please Wait';
    return '🎲 Roll Dice';
  };

  return (
    <View style={gameStyles.diceContainer}>
      <TouchableOpacity
        style={getButtonStyle()}
        onPress={handleRoll}
        disabled={!isMyTurn || disabled || isRolling}
        activeOpacity={0.8}
      >
        <Text style={gameStyles.diceButtonText}>
          {getButtonText()}
        </Text>
      </TouchableOpacity>

      {lastRoll && (
        <Animated.View 
          style={[
            gameStyles.diceResult,
            { transform: [{ scale: animatedValue }] }
          ]}
        >
          <Text style={gameStyles.diceValue}>
            {DICE_FACES[lastRoll.value - 1]}
          </Text>
          <Text style={gameStyles.diceText}>
            Rolled: {lastRoll.value}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}