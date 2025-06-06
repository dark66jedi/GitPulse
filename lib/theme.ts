// lib/theme.ts
import { useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightTheme = {
  colors: {
    // Core colors
    background: '#f8fafc',
    surface: '#ffffff',
    surfaceVariant: '#f1f5f9',
    surfaceContainer: '#e2e8f0',
    
    // Primary palette (GitPulse main blue)
    primary: '#1e40af',
    primaryContainer: '#dbeafe',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#1e3a8a',
    
    // Secondary palette (GitPulse light blue)
    secondary: '#0ea5e9',
    secondaryContainer: '#e0f2fe',
    onSecondary: '#ffffff',
    onSecondaryContainer: '#0c4a6e',
    
    // Accent/Tertiary (complementary blue-cyan)
    accent: '#06b6d4',
    accentContainer: '#cffafe',
    
    // Text hierarchy
    text: '#1e293b',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    onSurface: '#1e293b',
    onSurfaceVariant: '#475569',
    
    // Interactive states
    inputBackground: '#f8fafc',
    inputBorder: '#cbd5e1',
    inputBorderFocused: '#1e40af',
    
    // Structural elements
    border: '#e2e8f0',
    borderVariant: '#f1f5f9',
    divider: '#f1f5f9',
    
    // Navigation
    tabBarBackground: '#ffffff',
    headerBackground: '#ffffff',
    cardBackground: '#ffffff',
    
    // Status colors
    success: '#059669',
    successContainer: '#d1fae5',
    warning: '#d97706',
    warningContainer: '#fed7aa',
    error: '#dc2626',
    errorContainer: '#fee2e2',
    
    // Overlays
    backdrop: 'rgba(0, 0, 0, 0.5)',
    overlay: 'rgba(255, 255, 255, 0.9)',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.1)',
    shadowElevated: 'rgba(0, 0, 0, 0.15)',
  },
};

export const darkTheme = {
  colors: {
    // Core colors
    background: '#0f172a',
    surface: '#1e293b',
    surfaceVariant: '#334155',
    surfaceContainer: '#475569',
    
    // Primary palette (GitPulse main blue - brighter for dark mode)
    primary: '#3b82f6',
    primaryContainer: '#1e3a8a',
    onPrimary: '#ffffff',
    onPrimaryContainer: '#dbeafe',
    
    // Secondary palette (GitPulse light blue - adjusted for dark)
    secondary: '#38bdf8',
    secondaryContainer: '#0369a1',
    onSecondary: '#0c4a6e',
    onSecondaryContainer: '#e0f2fe',
    
    // Accent/Tertiary
    accent: '#22d3ee',
    accentContainer: '#0891b2',
    
    // Text hierarchy
    text: '#f8fafc',
    textSecondary: '#cbd5e1',
    textTertiary: '#94a3b8',
    onSurface: '#e2e8f0',
    onSurfaceVariant: '#cbd5e1',
    
    // Interactive states
    inputBackground: '#334155',
    inputBorder: '#475569',
    inputBorderFocused: '#3b82f6',
    
    // Structural elements
    border: '#475569',
    borderVariant: '#334155',
    divider: '#334155',
    
    // Navigation
    tabBarBackground: '#1e293b',
    headerBackground: '#1e293b',
    cardBackground: '#1e293b',
    
    // Status colors
    success: '#10b981',
    successContainer: '#064e3b',
    warning: '#f59e0b',
    warningContainer: '#92400e',
    error: '#f87171',
    errorContainer: '#991b1b',
    
    // Overlays
    backdrop: 'rgba(0, 0, 0, 0.7)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    
    // Shadow colors
    shadow: 'rgba(0, 0, 0, 0.3)',
    shadowElevated: 'rgba(0, 0, 0, 0.4)',
  },
};

export type Theme = typeof lightTheme;
export type ThemeMode = 'light' | 'dark' | 'system';

// Global state for theme
let globalThemeMode: ThemeMode = 'system';
let themeListeners: Array<() => void> = [];

// Function to notify all listeners when theme changes
const notifyListeners = () => {
  themeListeners.forEach(listener => listener());
};

// Function to set theme globally
export const setGlobalTheme = async (mode: ThemeMode) => {
  globalThemeMode = mode;
  try {
    await AsyncStorage.setItem('theme-mode', mode);
  } catch (error) {
    console.error('Error saving theme:', error);
  }
  notifyListeners();
};

// Hook to use theme
export function useTheme() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');
  const [, forceUpdate] = useState({});
  const systemColorScheme = useColorScheme();

  // Load saved theme on first use
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('theme-mode');
        if (saved && ['light', 'dark', 'system'].includes(saved)) {
          globalThemeMode = saved as ThemeMode;
          setThemeMode(saved as ThemeMode);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, []);

  // Subscribe to theme changes
  useEffect(() => {
    const listener = () => {
      setThemeMode(globalThemeMode);
      forceUpdate({});
    };
    
    themeListeners.push(listener);
    
    return () => {
      themeListeners = themeListeners.filter(l => l !== listener);
    };
  }, []);

  const currentThemeMode = globalThemeMode || themeMode;
  const isDark = currentThemeMode === 'dark' || (currentThemeMode === 'system' && systemColorScheme === 'dark');
  const theme = isDark ? darkTheme : lightTheme;

  return {
    theme,
    themeMode: currentThemeMode,
    setThemeMode: setGlobalTheme,
    isDark,
  };
}

// Helper functions for common color operations
export const getContrastColor = (theme: Theme, surface: keyof Theme['colors'] = 'surface') => {
  return theme.colors.onSurface;
};

export const getElevationStyle = (theme: Theme, elevation: number = 1) => {
  const shadowOpacity = Math.min(0.15 + (elevation * 0.05), 0.3);
  return {
    shadowColor: theme.colors.shadow,
    shadowOffset: {
      width: 0,
      height: elevation,
    },
    shadowOpacity,
    shadowRadius: elevation * 2,
    elevation: elevation * 2, // Android
  };
};