import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';

const DiceComponent = ({ value, onRoll, disabled = false }) => {
  const [rolling, setRolling] = useState(false);
  const [rotateAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(1));

  const handleRoll = () => {
    if (rolling || disabled) return;
    
    setRolling(true);
    
    // Complex animation sequence
    Animated.sequence([
      // Scale up and rotate
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 5, // 5 full rotations
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Scale back down
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setRolling(false);
      rotateAnim.setValue(0); // Reset rotation
    });
    
    // Call onRoll after a delay to sync with animation
    setTimeout(() => {
      onRoll();
    }, 600);
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

  const getDiceDots = (num) => {
    const dotPatterns = {
      1: [4], // center
      2: [0, 8], // top-left, bottom-right
      3: [0, 4, 8], // top-left, center, bottom-right
      4: [0, 2, 6, 8], // corners
      5: [0, 2, 4, 6, 8], // corners + center
      6: [0, 2, 3, 5, 6, 8] // sides
    };
    
    return dotPatterns[num] || [4];
  };

  const renderDiceFace = () => {
    if (rolling) {
      return (
        <Text style={styles.rollingText}>🎲</Text>
      );
    }

    const dots = getDiceDots(value);
    return (
      <View style={styles.diceGrid}>
        {Array.from({ length: 9 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.dotPosition,
              dots.includes(index) && styles.dot
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.diceContainer}
        onPress={handleRoll}
        disabled={rolling || disabled}
        activeOpacity={disabled ? 1 : 0.8}
      >
        <Animated.View
          style={[
            styles.dice,
            {
              transform: [
                { rotate: spin },
                { scale: scaleAnim }
              ]
            },
            rolling && styles.rollingDice
          ]}
        >
          {/* Dice face */}
          <View style={styles.diceFace}>
            {renderDiceFace()}
          </View>
          
          {/* Glossy effect */}
          <View style={styles.glossyEffect} />
          
          {/* Inner shadow */}
          <View style={styles.innerShadow} />
        </Animated.View>
      </TouchableOpacity>
      
      <Text style={[styles.rollText, rolling && styles.rollingText]}>
        {rolling ? 'Rolling...' : disabled ? 'Wait for turn' : 'Tap to Roll'}
      </Text>
      
      {/* Dice value display */}
      <View style={styles.valueContainer}>
        <Text style={styles.valueText}>Value: {value}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  diceContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  dice: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
  },
  rollingDice: {
    backgroundColor: '#FFD700',
    borderColor: '#FFA500',
    shadowColor: '#FFD700',
    shadowOpacity: 0.6,
  },
  diceFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  diceGrid: {
    width: 54,
    height: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dotPosition: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    backgroundColor: '#333',
    borderRadius: 9,
    width: 12,
    height: 12,
  },
  rollingText: {
    fontSize: 40,
    textAlign: 'center',
  },
  glossyEffect: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: 12,
  },
  innerShadow: {
    position: 'absolute',
    inset: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  rollText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginTop: 12,
  },
  rollingText: {
    color: '#FFD700',
  },
  valueContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
  },
  valueText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
});

export default DiceComponent;