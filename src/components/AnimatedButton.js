import React, { useRef, useEffect } from 'react';
import { TouchableOpacity, Text, Animated, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { theme } from '../styles/theme';

const AnimatedButton = ({
  title,
  onPress,
  variant = 'primary', // primary, secondary, accent, gaming, cyber
  size = 'medium', // small, medium, large, mega
  icon = null,
  disabled = false,
  style = {},
  textStyle = {},
  animated = true,
  glowEffect = true,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (animated && !disabled) {
      // Continuous pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.02,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Glow animation
      if (glowEffect) {
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 2000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 2000,
              useNativeDriver: false,
            }),
          ])
        ).start();
      }
    }
  }, [animated, disabled, glowEffect]);

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    }
  };

  const getGradientColors = () => {
    if (disabled) return ['#666666', '#888888'];
    
    switch (variant) {
      case 'secondary':
        return theme.colors.gradientSecondary;
      case 'accent':
        return theme.colors.gradientAccent;
      case 'gaming':
        return theme.colors.gradientGaming;
      case 'cyber':
        return theme.colors.gradientCyber;
      case 'neon':
        return theme.colors.gradientNeon;
      default:
        return theme.colors.gradientPrimary;
    }
  };

  const getShadowStyle = () => {
    if (disabled) return {};
    
    switch (variant) {
      case 'secondary':
        return theme.shadows.neonCyan;
      case 'accent':
        return theme.shadows.neonGold;
      case 'gaming':
        return theme.shadows.neonPurple;
      case 'cyber':
        return theme.shadows.neonCyan;
      default:
        return theme.shadows.neonPink;
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: theme.spacing.md,
          minHeight: 40,
          borderRadius: theme.borderRadius.md,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.lg,
          paddingHorizontal: theme.spacing.xl,
          minHeight: 64,
          borderRadius: theme.borderRadius.xl,
        };
      case 'mega':
        return {
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing.xxl,
          minHeight: 72,
          borderRadius: theme.borderRadius.xxl,
        };
      default: // medium
        return {
          paddingVertical: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          minHeight: 56,
          borderRadius: theme.borderRadius.lg,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'small':
        return theme.fonts.sizes.sm;
      case 'large':
        return theme.fonts.sizes.lg;
      case 'mega':
        return theme.fonts.sizes.xl;
      default:
        return theme.fonts.sizes.md;
    }
  };

  const glowIntensity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        getSizeStyles(),
        getShadowStyle(),
        {
          transform: [
            { scale: animated ? Animated.multiply(scaleAnim, pulseAnim) : 1 },
          ],
          opacity: glowEffect ? glowIntensity : 1,
        },
        style,
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        {...props}
      >
        <LinearGradient
          colors={getGradientColors()}
          style={[styles.gradient, getSizeStyles()]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={[
            styles.text,
            {
              fontSize: getTextSize(),
              opacity: disabled ? 0.6 : 1,
            },
            textStyle,
          ]}>
            {icon && `${icon} `}{title}
          </Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  touchable: {
    
  },
  gradient: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});

export default AnimatedButton;