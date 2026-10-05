import React from 'react';
import { StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { Searchbar } from 'react-native-paper';

import { borderRadius } from '@/theme';

interface CampoBuscaProps {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function CampoBusca({
  placeholder,
  value,
  onChangeText,
  accessibilityLabel = 'Campo de busca',
  style,
}: CampoBuscaProps) {
  return (
    <Searchbar
      placeholder={placeholder}
      onChangeText={onChangeText}
      value={value}
      style={[styles.searchbar, style as any]}
      elevation={1}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

const styles = StyleSheet.create({
  searchbar: {
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F3F9',
  },
});
