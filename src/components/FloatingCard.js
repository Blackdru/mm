import React, { useRef, useEffect } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../styles/theme';

const FloatingCard = ({
  children,
  variant = 'glass', // glass, neon, premium, gaming
  animated = true,
  glowEffect = true,
  style = {},
  ...props
}) => {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Floating animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatAnim, {
            toValue: 1,
            duration: 3000,
            useNativeDriver: true,
          }),
          Animated.timing(floatAnim, {
            toValue: 0,
            duration: 3000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Subtle rotation
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          useNativeDriver: true,
        })
      ).start();
    }

    if (glowEffect) {
      // Glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2500,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [animated, glowEffect]);

  const getGradientColors = () => {
    switch (variant) {
      case 'neon':
        return theme.colors.gradientNeon;
      case 'premium':
        return theme.colors.gradientAccent;
      case 'gaming':
        return theme.colors.gradientGaming;
      default: // glass
        return theme.colors.gradientCard;
    }
  };

  const getShadowStyle = () => {
    switch (variant) {
      case 'neon':
        return theme.shadows.neonCyan;
      case 'premium':
        return theme.shadows.neonGold;
      case 'gaming':
        return theme.shadows.neonPurple;
      default:
        return theme.shadows.floatingCard;
    }
  };

  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '1deg'],
  });

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        getShadowStyle(),
        {
          transform: animated ? [
            { translateY: floatY },
            { rotate: rotate },
          ] : [],
          opacity: glowEffect ? glowIntensity : 1,
        },
        style,
      ]}
      {...props}
    >
      <LinearGradient
        colors={getGradientColors()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {children}
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.borderRadius.xl,
    overflow: 'hidden',
  },
  gradient: {
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    padding: theme.spacing.lg,
  },
});

export default FloatingCard;