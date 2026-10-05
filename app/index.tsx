import { Stack } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { spacing } from '@/theme';

export default function HomeScreen() {
  const theme = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Farmácia Perto' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text variant="headlineMedium" style={[styles.title, { color: theme.colors.primary }]}>
          Farmácia Perto
        </Text>

        <Button
          mode="contained"
          onPress={() => {}}
          style={styles.button}
        >
          Botão Primário de Teste
        </Button>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
});
