import { StyleSheet, View } from 'react-native';
import { ActivityIndicator, Text, useTheme } from 'react-native-paper';

import { spacing } from '@/theme';

interface LoadingViewProps {
  message?: string;
}

export function LoadingView({ message = 'Carregando...' }: LoadingViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message}>
      <ActivityIndicator size="large" />
      <Text variant="bodyMedium" style={[styles.text, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  text: {
    marginTop: spacing.md,
  },
});
