import { useEffect, useState } from 'react';
import { Animated, LayoutChangeEvent, ScrollView, StyleSheet, View } from 'react-native';
import { Button, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { borderRadius, spacing } from '@/theme';
import { Farmacia } from '@/types';

export type VariantePainel = 'inferior' | 'lateral';

interface PainelFarmaciaProps {
  farmacia: Farmacia;
  nomeMunicipio: string;
  uf: string;
  variante: VariantePainel;
  onTracarRota: (farmacia: Farmacia) => void;
  onFechar: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
}

export const LARGURA_PAINEL_LATERAL = 360;
const DESLOCAMENTO_ENTRADA = 48;
const DURACAO_ENTRADA_MS = 220;

export function PainelFarmacia({
  farmacia,
  nomeMunicipio,
  uf,
  variante,
  onTracarRota,
  onFechar,
  onLayout,
}: PainelFarmaciaProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [progresso] = useState(() => new Animated.Value(0));
  const lateral = variante === 'lateral';

  // Reexecuta a animação de entrada sempre que outra farmácia é selecionada.
  useEffect(() => {
    progresso.setValue(0);
    Animated.timing(progresso, {
      toValue: 1,
      duration: DURACAO_ENTRADA_MS,
      useNativeDriver: true,
    }).start();
  }, [farmacia.id, progresso]);

  const deslocamento = progresso.interpolate({
    inputRange: [0, 1],
    outputRange: [DESLOCAMENTO_ENTRADA, 0],
  });
  const transform = lateral ? [{ translateX: deslocamento }] : [{ translateY: deslocamento }];

  return (
    <Animated.View
      style={[lateral ? styles.wrapperLateral : styles.wrapperInferior, { opacity: progresso, transform }]}
      onLayout={onLayout}
    >
      <Surface
        elevation={3}
        style={[
          lateral ? styles.surfaceLateral : styles.surfaceInferior,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: (lateral ? 0 : insets.bottom) + spacing.md,
          },
        ]}
      >
        <ScrollView bounces={false} contentContainerStyle={styles.conteudo}>
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
        </ScrollView>
      </Surface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapperInferior: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  wrapperLateral: {
    width: LARGURA_PAINEL_LATERAL,
    height: '100%',
  },
  surfaceInferior: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.sm,
  },
  surfaceLateral: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  conteudo: {
    paddingHorizontal: spacing.md,
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
