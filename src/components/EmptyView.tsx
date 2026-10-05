import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing } from '@/theme';

interface EmptyViewProps {
  title?: string;
  message?: string;
  iconName?: keyof typeof MaterialCommunityIcons.glyphMap;
}

export function EmptyView({
  title = 'Nenhum resultado encontrado',
  message = 'Tente pesquisar por outro termo.',
  iconName = 'map-search-outline',
}: EmptyViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={iconName} size={48} color={theme.colors.outline} />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.onSurface }]}>
        {title}
      </Text>
      {message ? (
        <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.outline }]}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  title: {
    marginTop: spacing.md,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
