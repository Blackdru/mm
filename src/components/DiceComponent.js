import React, {useState} from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';

const DiceComponent = ({value, onRoll}) => {
  const [rolling, setRolling] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));

  const handleRoll = () => {
    if (rolling) return;
    
    setRolling(true);
    
    // Animate dice roll
    Animated.sequence([
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRolling(false);
    });
    
    onRoll();
  };

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getDiceFace = (num) => {
    const faces = {
      1: '⚀',
      2: '⚁',
      3: '⚂',
      4: '⚃', 
      5: '⚄',
      6: '⚅'
    };
    return faces[num] || '⚀';
  };

  return (
    <TouchableOpacity
      style={styles.diceContainer}
      onPress={handleRoll}
      disabled={rolling}>
      <Animated.View
        style={[
          styles.dice,
          {transform: [{rotate: spin}]},
          rolling && styles.rollingDice
        ]}>
        <Text style={styles.diceText}>
          {rolling ? '🎲' : getDiceFace(value)}
        </Text>
      </Animated.View>
      <Text style={styles.rollText}>
        {rolling ? 'Rolling...' : 'Tap to Roll'}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  diceContainer: {
    alignItems: 'center',
  },
  dice: {
    width: 60,
    height: 60,
    backgroundColor: '#FFF',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  rollingDice: {
    backgroundColor: '#FFD700',
  },
  diceText: {
    fontSize: 32,
  },
  rollText: {
    fontSize: 14,
    color: '#FFF',
    marginTop: 8,
  },
});

export default DiceComponent;