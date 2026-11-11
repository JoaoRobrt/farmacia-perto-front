import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, View } from 'react-native';
import { Button, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, spacing } from '@/theme';
import { Farmacia } from '@/types';

interface PainelFarmaciaProps {
  farmacia: Farmacia;
  nomeMunicipio: string;
  uf: string;
  onTracarRota: (farmacia: Farmacia) => void;
  onFechar: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

const DESLOCAMENTO_ENTRADA = 48;
const DURACAO_ENTRADA_MS = 220;

export function PainelFarmacia({ farmacia, nomeMunicipio, uf, onTracarRota, onFechar, onLayout }: PainelFarmaciaProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [progresso] = useState(() => new Animated.Value(0));

  // Reexecuta a animação de entrada sempre que outra farmácia é selecionada.
  useEffect(() => {
    progresso.setValue(0);
    Animated.timing(progresso, {
      toValue: 1,
      duration: DURACAO_ENTRADA_MS,
      useNativeDriver: true,
    }).start();
  }, [farmacia.id, progresso]);

  const translateY = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [DESLOCAMENTO_ENTRADA, 0],
  });

  return (
    <Animated.View
      style={[styles.wrapper, { opacity: progresso, transform: [{ translateY }] }]}
      onLayout={onLayout}
    >
      <Surface
        elevation={3}
        style={[
          styles.surface,
          { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        <View style={styles.cabecalho}>
          <Text variant="titleLarge" style={styles.nome} accessibilityRole="header">
            {farmacia.nome}
          </Text>
          <IconButton
            icon="close"
            onPress={onFechar}
            accessibilityLabel="Fechar detalhes da farmácia"
            style={styles.botaoFechar}
          />
        </View>

        <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
          {farmacia.endereco}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {farmacia.bairro} — {nomeMunicipio}/{uf}
        </Text>

        <Button
          mode="contained"
          icon="directions"
          onPress={() => onTracarRota(farmacia)}
          style={styles.botaoRota}
          contentStyle={styles.botaoRotaConteudo}
          accessibilityLabel={`Traçar rota até ${farmacia.nome} no Google Maps`}
        >
          Traçar rota
        </Button>

        <Text variant="bodySmall" style={[styles.aviso, { color: theme.colors.onSurfaceVariant }]}>
          A localização não confirma estoque de medicamentos.
        </Text>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  surface: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nome: {
    flex: 1,
    fontWeight: 'bold',
  },
  botaoFechar: {
    marginRight: -spacing.sm,
    width: 48,
    height: 48,
  },
  botaoRota: {
    marginTop: spacing.md,
  },
  botaoRotaConteudo: {
    minHeight: 48,
  },
  aviso: {
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
