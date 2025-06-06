// components/ThemeToggle.tsx
import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../lib/theme';

export function ThemeToggle() {
  const { isDark, setThemeMode, theme } = useTheme();

  const handleToggle = () => {
    setThemeMode(isDark ? 'light' : 'dark');
  };

  return (
    <TouchableOpacity 
      onPress={handleToggle} 
      style={{ marginRight: 8, padding: 4 }}
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      accessibilityHint="Tap to toggle between light and dark mode"
    >
      <Ionicons 
        name={isDark ? 'sunny' : 'moon'} 
        size={24} 
        color={theme.colors.primary} 
      />
    </TouchableOpacity>
  );
}
