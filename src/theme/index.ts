import { MD3LightTheme, MD3Theme } from 'react-native-paper';

export const theme: MD3Theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1351B4',
    onPrimary: '#FFFFFF',
    primaryContainer: '#D6E4FF',
    onPrimaryContainer: '#001945',
    secondary: '#071D41',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#DBE2F9',
    onSecondaryContainer: '#001B3D',
    background: '#F8F9FA',
    onBackground: '#1A1C1E',
    surface: '#FFFFFF',
    onSurface: '#1A1C1E',
    surfaceVariant: '#E0E2EC',
    onSurfaceVariant: '#43474E',
    error: '#BA1A1A',
    onError: '#FFFFFF',
    errorContainer: '#FFDAD6',
    onErrorContainer: '#410002',
    outline: '#74777F',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 9999,
} as const;
