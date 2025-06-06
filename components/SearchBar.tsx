import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useTheme } from '../lib/theme'; // Add theme import

interface SearchBarProps extends TextInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export default function SearchBar({ 
  value, 
  onChangeText, 
  placeholder = "Search...", 
  style,
  ...props 
}: SearchBarProps) {
  // Add theme hook
  const { theme, isDark } = useTheme();

  // Create dynamic styles that use theme colors
  const styles = StyleSheet.create({
    input: {
      marginBottom: 12,
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.card || theme.colors.surface || theme.colors.background,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border || (isDark ? 'rgba(255, 255, 255, 0.2)' : '#e0e0e0'),
      color: theme.colors.text,
      // Add shadow for light mode
      shadowColor: isDark ? 'transparent' : '#000',
      shadowOpacity: isDark ? 0 : 0.05,
      shadowOffset: { width: 0, height: 1 },
      shadowRadius: 2,
      elevation: isDark ? 0 : 1,
    },
  });

  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.colors.textSecondary || theme.colors.text}
      returnKeyType="search"
      {...props}
    />
  );
}