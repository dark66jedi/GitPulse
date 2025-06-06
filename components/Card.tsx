import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ReactNode } from 'react';
import { useTheme } from '../lib/theme'; // Add theme import

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
};

export default function Card({ children, onPress, style, activeOpacity = 0.9 }: CardProps) {
  // Add theme hook
  const { theme, isDark } = useTheme();
  
  // Create dynamic styles that use theme colors
  const styles = StyleSheet.create({
    card: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: theme.colors.card || theme.colors.surface || theme.colors.background,
      marginVertical: 8,
      elevation: isDark ? 0 : 2,
      shadowColor: isDark ? theme.colors.text : '#000',
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      // Add border for dark mode definition
      borderWidth: isDark ? 1 : 0,
      borderColor: theme.colors.border || 'rgba(255, 255, 255, 0.1)',
    },
  });

  const CardComponent = onPress ? TouchableOpacity : View;
  
  return (
    <CardComponent
      onPress={onPress}
      activeOpacity={activeOpacity}
      style={[styles.card, style]}
    >
      {children}
    </CardComponent>
  );
}