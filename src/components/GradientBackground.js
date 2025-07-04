import React from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

// Simple, non-animated background - No battery drain
const GradientBackground = ({ 
  children, 
  variant = 'primary',
  style = {},
  ...props 
}) => {
  const getBackgroundColor = () => {
    switch (variant) {
      case 'light':
        return theme.colors.backgroundLight;
      case 'card':
        return theme.colors.backgroundCard;
      default:
        return theme.colors.background;
    }
  };

  return (
    <View 
      style={[
        styles.container, 
        { backgroundColor: getBackgroundColor() }, 
        style
      ]} 
      {...props}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default GradientBackground;