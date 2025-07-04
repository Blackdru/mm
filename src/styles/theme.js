import { getResponsiveSpacing, getResponsiveFontSize, screenData } from '../utils/responsive';

// Enhanced Clean Dark Gaming Theme
export const theme = {
  colors: {
    // Primary Colors - Attractive but not harsh
    primary: '#6366F1', // Indigo 500 - Modern, attractive
    primaryDark: '#4F46E5', // Indigo 600
    primaryLight: '#818CF8', // Indigo 400
    
    // Secondary Colors - Vibrant but easy on eyes
    secondary: '#10B981', // Emerald 500
    secondaryDark: '#059669', // Emerald 600
    secondaryLight: '#34D399', // Emerald 400
    
    // Accent Colors - Warm and attractive
    accent: '#F59E0B', // Amber 500
    accentDark: '#D97706', // Amber 600
    accentLight: '#FBBF24', // Amber 400
    
    // Status Colors
    success: '#10B981', // Emerald 500
    warning: '#F59E0B', // Amber 500
    danger: '#EF4444', // Red 500
    info: '#3B82F6', // Blue 500
    
    // Background Colors - Rich dark theme
    background: '#0F172A', // Slate 900 - Deep dark
    backgroundLight: '#1E293B', // Slate 800
    backgroundCard: '#334155', // Slate 700
    backgroundInput: '#475569', // Slate 600
    backgroundModal: '#1E293B', // Slate 800
    
    // Surface Colors
    surface: '#FFFFFF',
    surfaceDark: '#F8FAFC', // Slate 50
    surfaceCard: '#334155', // Slate 700
    surfaceLight: '#475569', // Slate 600
    
    // Text Colors - Perfect contrast
    textPrimary: '#F8FAFC', // Slate 50 - Crisp white
    textSecondary: '#CBD5E1', // Slate 300 - Clear gray
    textTertiary: '#94A3B8', // Slate 400 - Muted gray
    textDark: '#0F172A', // Slate 900 - For light backgrounds
    textLight: '#64748B', // Slate 500 - Subtle text
    textMuted: '#64748B', // Slate 500 - Very subtle
    
    // Special Text Colors
    textSuccess: '#34D399', // Emerald 400
    textWarning: '#FBBF24', // Amber 400
    textDanger: '#F87171', // Red 400
    textInfo: '#60A5FA', // Blue 400
    
    // Border Colors
    border: '#475569', // Slate 600
    borderLight: '#64748B', // Slate 500
    borderDark: '#334155', // Slate 700
    borderFocus: '#6366F1', // Indigo 500
    
    // Attractive Gradients
    gradientPrimary: ['#6366F1', '#8B5CF6'], // Indigo to Purple
    gradientSecondary: ['#10B981', '#06B6D4'], // Emerald to Cyan
    gradientAccent: ['#F59E0B', '#EF4444'], // Amber to Red
    gradientDark: ['#0F172A', '#1E293B'], // Dark gradient
    gradientCard: ['#334155', '#475569'], // Card gradient
    
    // Game Colors
    player1: '#EF4444', // Red 500
    player2: '#10B981', // Emerald 500
    player3: '#3B82F6', // Blue 500
    player4: '#8B5CF6', // Violet 500
    
    // Status
    online: '#10B981',
    offline: '#64748B',
    away: '#F59E0B',
  },
  
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
      xs: getResponsiveFontSize(11),
      sm: getResponsiveFontSize(13),
      md: getResponsiveFontSize(15),
      lg: getResponsiveFontSize(17),
      xl: getResponsiveFontSize(19),
      xxl: getResponsiveFontSize(22),
      xxxl: getResponsiveFontSize(26),
      mega: getResponsiveFontSize(32),
    },
  },
  
  spacing: {
    xs: getResponsiveSpacing(4),
    sm: getResponsiveSpacing(8),
    md: getResponsiveSpacing(12),
    lg: getResponsiveSpacing(16),
    xl: getResponsiveSpacing(20),
    xxl: getResponsiveSpacing(24),
    xxxl: getResponsiveSpacing(32),
  },
  
  borderRadius: {
    xs: 4,
    sm: 6,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 20,
    xxxl: 24,
    round: 50,
  },
  
  // Subtle but attractive shadows
  shadows: {
    none: {},
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.12,
      shadowRadius: 3,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.16,
      shadowRadius: 6,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    // Subtle colored shadows for attraction
    primaryShadow: {
      shadowColor: '#6366F1',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    successShadow: {
      shadowColor: '#10B981',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
  },
  
  animations: {
    fast: 150,
    normal: 250,
    slow: 350,
  },
  
  screen: screenData,
};

// Enhanced Common Styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  safeContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 20, // Safe area padding
  },
  
  scrollContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl, // Prevent bottom trimming
  },
  
  // Enhanced Cards
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.medium,
  },
  
  // Attractive card with gradient border
  attractiveCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    ...theme.shadows.primaryShadow,
  },
  
  // Compact Card
  compactCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.small,
  },
  
  // Center Card
  centerCard: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.lg,
    marginVertical: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.large,
    alignSelf: 'center',
    width: '90%',
  },
  
  // Buttons
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...theme.shadows.primaryShadow,
  },
  
  // Large attractive button
  largeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.xl,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    ...theme.shadows.primaryShadow,
    marginVertical: theme.spacing.sm,
  },
  
  // Secondary button
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    ...theme.shadows.successShadow,
  },
  
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: '600',
  },
  
  largeButtonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.lg,
    fontWeight: '700',
  },
  
  // Enhanced Input
  input: {
    backgroundColor: theme.colors.backgroundInput,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textPrimary,
    borderWidth: 1,
    borderColor: theme.colors.border,
    minHeight: 52,
    ...theme.shadows.small,
  },
  
  inputFocused: {
    borderColor: theme.colors.borderFocus,
    borderWidth: 2,
    ...theme.shadows.primaryShadow,
  },
  
  // Typography with proper spacing
  title: {
    fontSize: theme.fonts.sizes.xxxl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    textAlign: 'center',
    lineHeight: theme.fonts.sizes.xxxl * 1.2,
  },
  
  subtitle: {
    fontSize: theme.fonts.sizes.lg,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.lg,
    textAlign: 'center',
    lineHeight: theme.fonts.sizes.lg * 1.3,
  },
  
  sectionTitle: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
    marginTop: theme.spacing.md,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  spaceBetween: {
    justifyContent: 'space-between',
  },
  
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Text styles with proper colors
  primaryText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    lineHeight: theme.fonts.sizes.md * 1.4,
  },
  
  secondaryText: {
    color: theme.colors.textSecondary,
    fontSize: theme.fonts.sizes.md,
    lineHeight: theme.fonts.sizes.md * 1.4,
  },
  
  accentText: {
    color: theme.colors.accent,
    fontWeight: '600',
    fontSize: theme.fonts.sizes.md,
  },
  
  successText: {
    color: theme.colors.textSuccess,
    fontWeight: '600',
    fontSize: theme.fonts.sizes.md,
  },
  
  dangerText: {
    color: theme.colors.textDanger,
    fontWeight: '600',
    fontSize: theme.fonts.sizes.md,
  },
  
  // Safe area helpers
  safeTop: {
    paddingTop: 20,
  },
  
  safeBottom: {
    paddingBottom: 20,
  },
  
  safeHorizontal: {
    paddingHorizontal: theme.spacing.lg,
  },
};

export default theme;