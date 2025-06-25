import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width, height } = Dimensions.get('window');

const GradientBackground = ({ 
  children, 
  primaryColor = theme.colors.background,
  style = {},
  ...props 
}) => {
  return (
    <View
      style={[styles.gradient, { backgroundColor: primaryColor }, style]}
      {...props}
    >
      <View style={styles.overlay} />
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    width: width,
    minHeight: height,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 107, 53, 0.05)', // Subtle orange overlay
  },
});

export default GradientBackground;