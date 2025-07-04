import { Animated } from 'react-native';

// Animation utility to prevent native driver conflicts
export class AnimationManager {
  constructor() {
    this.animations = new Map();
  }

  // Create entrance animations (native driver compatible)
  createEntranceAnimations(fadeAnim, slideAnim) {
    const entranceAnimation = Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]);

    return entranceAnimation;
  }

  // Create pulse animation (native driver compatible)
  createPulseAnimation(pulseAnim, minScale = 1, maxScale = 1.05, duration = 1500) {
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: maxScale,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: minScale,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );

    return pulseAnimation;
  }

  // Create rotation animation (native driver compatible)
  createRotationAnimation(rotateAnim, duration = 3000) {
    const rotationAnimation = Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: duration,
        useNativeDriver: true,
      })
    );

    return rotationAnimation;
  }

  // Create opacity animation (native driver compatible)
  createOpacityAnimation(opacityAnim, minOpacity = 0.7, maxOpacity = 1, duration = 2000) {
    const opacityAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: maxOpacity,
          duration: duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: minOpacity,
          duration: duration,
          useNativeDriver: true,
        }),
      ])
    );

    return opacityAnimation;
  }

  // Start multiple animations and track them
  startAnimations(animationConfigs) {
    const runningAnimations = [];

    animationConfigs.forEach(config => {
      const animation = config.animation;
      animation.start();
      runningAnimations.push(animation);
      
      if (config.key) {
        this.animations.set(config.key, animation);
      }
    });

    return runningAnimations;
  }

  // Stop all animations
  stopAllAnimations() {
    this.animations.forEach(animation => {
      animation.stop();
    });
    this.animations.clear();
  }

  // Stop specific animation
  stopAnimation(key) {
    const animation = this.animations.get(key);
    if (animation) {
      animation.stop();
      this.animations.delete(key);
    }
  }

  // Create interpolation for rotation
  createRotationInterpolation(animatedValue) {
    return animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: ['0deg', '360deg'],
    });
  }

  // Create interpolation for opacity
  createOpacityInterpolation(animatedValue, inputRange = [0, 1], outputRange = [0.7, 1]) {
    return animatedValue.interpolate({
      inputRange,
      outputRange,
    });
  }
}

// Singleton instance
export const animationManager = new AnimationManager();

// Predefined animation configurations
export const ANIMATION_CONFIGS = {
  ENTRANCE: {
    duration: 800,
    useNativeDriver: true,
  },
  PULSE: {
    duration: 1500,
    useNativeDriver: true,
    scale: { min: 1, max: 1.05 },
  },
  ROTATION: {
    duration: 3000,
    useNativeDriver: true,
  },
  OPACITY: {
    duration: 2000,
    useNativeDriver: true,
    opacity: { min: 0.7, max: 1 },
  },
};

// Helper function to create safe animated values
export const createAnimatedValues = () => {
  return {
    fade: new Animated.Value(0),
    slide: new Animated.Value(50),
    pulse: new Animated.Value(1),
    rotate: new Animated.Value(0),
    opacity: new Animated.Value(0.7),
  };
};

export default animationManager;