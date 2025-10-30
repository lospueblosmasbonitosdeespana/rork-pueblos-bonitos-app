export const COLORS = {
  light: {
    primary: '#A22C22',
    secondary: '#CBB682',
    green: '#43a047',
    yellow: '#fbc02d',
    red: '#A22C22',
    background: '#F5F1EA',
    card: '#ffffff',
    text: '#3A3A3A',
    textSecondary: '#666666',
    border: '#e0e0e0',
    error: '#A22C22',
    success: '#43a047',
    beige: '#F5F1EA',
    gold: '#CBB682',
  },
  dark: {
    primary: '#D94D3D',
    secondary: '#E6D7A3',
    green: '#66bb6a',
    yellow: '#fdd835',
    red: '#D94D3D',
    background: '#1a1a1a',
    card: '#2a2a2a',
    text: '#E8E8E8',
    textSecondary: '#B0B0B0',
    border: '#3a3a3a',
    error: '#D94D3D',
    success: '#66bb6a',
    beige: '#2a2520',
    gold: '#E6D7A3',
  },
} as const;

export const useThemeColors = (isDark: boolean) => {
  return isDark ? COLORS.dark : COLORS.light;
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const TYPOGRAPHY = {
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  small: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
} as const;

export const SHADOWS = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;
