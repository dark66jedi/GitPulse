import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { ReactNode } from 'react';

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  activeOpacity?: number;
};

export default function Card({ children, onPress, style, activeOpacity = 0.9 }: CardProps) {
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

const styles = StyleSheet.create({
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#4bf',
    marginVertical: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
});