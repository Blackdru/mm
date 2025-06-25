import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { theme } from '../styles/theme';

const { width } = Dimensions.get('window');

const CommonHeader = ({ 
  title, 
  onBackPress, 
  showBackButton = true, 
  rightComponent = null,
  subtitle = null,
  icon = null,
  style = {}
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.headerRow}>
        {showBackButton && (
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBackPress}
            activeOpacity={0.7}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.titleContainer}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        
        <View style={styles.rightContainer}>
          {rightComponent}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    marginHorizontal: theme.spacing.md,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    padding: theme.spacing.md,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.sm,
    ...theme.shadows.small,
    minWidth: 60,
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
  },
  icon: {
    fontSize: 24,
    marginBottom: theme.spacing.xs,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 107, 53, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    fontWeight: '500',
  },
  rightContainer: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
});

export default CommonHeader;