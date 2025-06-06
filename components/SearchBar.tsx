import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

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
  return (
    <TextInput
      style={[styles.input, style]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      returnKeyType="search"
      {...props}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
});