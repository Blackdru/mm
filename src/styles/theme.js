
import { getResponsiveSpacing, getResponsiveFontSize, screenData } from '../utils/responsive';

// Gaming Theme Configuration
export const theme = {
  colors: {
    // Primary Gaming Colors
    primary: '#FF6B35', // Vibrant Orange
    primaryDark: '#E55A2B',
    primaryLight: '#FF8A5C',
    
    // Secondary Colors
    secondary: '#4ECDC4', // Turquoise
    secondaryDark: '#3DB5AC',
    secondaryLight: '#6FD5CE',
    
    // Accent Colors
    accent: '#FFE66D', // Golden Yellow
    accentDark: '#E6CF62',
    accentLight: '#FFF285',
    
    // Gaming Specific
    success: '#2ECC71', // Green for wins
    warning: '#F39C12', // Orange for warnings
    danger: '#E74C3C', // Red for losses
    info: '#3498DB', // Blue for info
    
    // Background Colors
    background: '#1A1A2E', // Dark Navy
    backgroundLight: '#16213E', // Lighter Navy
    backgroundCard: '#0F3460', // Card Background
    
    // Surface Colors
    surface: '#FFFFFF',
    surfaceDark: '#F8F9FA',
    surfaceCard: 'rgba(255, 255, 255, 0.95)',
    
    // Text Colors
    textPrimary: '#FFFFFF',
    textSecondary: '#B0BEC5',
    textDark: '#2C3E50',
    textLight: '#7F8C8D',
    
    // Gradient Colors
    gradientPrimary: ['#FF6B35', '#FF8A5C'],
    gradientSecondary: ['#4ECDC4', '#6FD5CE'],
    gradientAccent: ['#FFE66D', '#FFF285'],
    gradientDark: ['#1A1A2E', '#16213E'],
    gradientCard: ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)'],
    
    // Game Colors
    player1: '#FF6B6B', // Red
    player2: '#4ECDC4', // Turquoise
    player3: '#45B7D1', // Blue
    player4: '#96CEB4', // Green
    
    // Status Colors
    online: '#2ECC71',
    offline: '#95A5A6',
    away: '#F39C12',
  },
  
  fonts: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    sizes: {
      xs: getResponsiveFontSize(12),
      sm: getResponsiveFontSize(14),
      md: getResponsiveFontSize(16),
      lg: getResponsiveFontSize(18),
      xl: getResponsiveFontSize(20),
      xxl: getResponsiveFontSize(24),
      xxxl: getResponsiveFontSize(32),
    },
  },
  
  spacing: {
    xs: getResponsiveSpacing(4),
    sm: getResponsiveSpacing(8),
    md: getResponsiveSpacing(16),
    lg: getResponsiveSpacing(24),
    xl: getResponsiveSpacing(32),
    xxl: getResponsiveSpacing(48),
  },
  
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    xxl: 24,
    round: 50,
  },
  
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3,
      shadowRadius: 10,
      elevation: 5,
    },
  },
  
  animations: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  
  // Screen dimensions
  screen: screenData,
};

// Common Styles
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  
  scrollContainer: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  
  card: {
    backgroundColor: theme.colors.surfaceCard,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    ...theme.shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.1)',
  },
  
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.small,
    minHeight: 44, // Minimum touch target
  },
  
  buttonText: {
    color: theme.colors.textPrimary,
    fontSize: theme.fonts.sizes.md,
    fontWeight: 'bold',
  },
  
  input: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textDark,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.2)',
    minHeight: 44, // Minimum touch target
    ...theme.shadows.small,
  },
  
  title: {
    fontSize: theme.fonts.sizes.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.xs,
  },
  
  subtitle: {
    fontSize: theme.fonts.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  
  sectionTitle: {
    fontSize: theme.fonts.sizes.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  
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
  
  gradient: {
    flex: 1,
  },
};

export default theme;