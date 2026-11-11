import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { spacing } from '@/theme';

interface ErrorViewProps {
  message?: string;
  onRetry: () => void;
  retryLabel?: string;
}

export function ErrorView({
  message = 'Não foi possível carregar os dados. Verifique sua conexão e tente novamente.',
  onRetry,
  retryLabel = 'Tentar novamente',
}: ErrorViewProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={theme.colors.error} />
      <Text variant="titleMedium" style={[styles.title, { color: theme.colors.error }]} accessibilityRole="alert">
        Ops! Algo deu errado
      </Text>
      <Text variant="bodyMedium" style={[styles.message, { color: theme.colors.onSurfaceVariant }]}>
        {message}
      </Text>
      <Button
        mode="contained"
        onPress={onRetry}
        style={styles.button}
        contentStyle={styles.buttonContent}
        icon="refresh"
      >
        {retryLabel}
      </Button>
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
    fontWeight: 'bold',
  },
  message: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  button: {
    minWidth: 160,
  },
  buttonContent: {
    minHeight: 48,
  },
});
