import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { theme } from '../styles/theme';

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
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.container, style]}>
        <View style={styles.headerRow}>
          {showBackButton ? (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onBackPress}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.backButtonPlaceholder} />
          )}
          
          <View style={styles.titleContainer}>
            <View style={styles.titleRow}>
              {icon && <Text style={styles.icon}>{icon}</Text>}
              <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>
            {subtitle && (
              <Text style={styles.subtitle} numberOfLines={2}>
                {subtitle}
              </Text>
            )}
          </View>
          
          <View style={styles.rightContainer}>
            {rightComponent}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: theme.colors.backgroundCard,
  },
  container: {
    backgroundColor: theme.colors.backgroundCard,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.small,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44, // Ensure minimum touch target
  },
  backButton: {
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    minWidth: 70,
    alignItems: 'center',
    ...theme.shadows.small,
  },
  backButtonPlaceholder: {
    width: 70, // Same width as back button for consistent spacing
  },
  backButtonText: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    maxWidth: '70%', // Prevent text overflow
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    flexShrink: 1, // Allow text to shrink if needed
  },
  subtitle: {
    fontSize: theme.fonts.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
    lineHeight: 16,
    flexShrink: 1,
  },
  rightContainer: {
    minWidth: 70,
    alignItems: 'flex-end',
  },
});

export default CommonHeader;