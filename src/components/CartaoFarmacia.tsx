import { memo } from 'react';
import { StyleSheet } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';

import { spacing } from '@/theme';
import { Farmacia } from '@/types';

interface CartaoFarmaciaProps {
  farmacia: Farmacia;
  selecionada: boolean;
  onVerNoMapa: (farmacia: Farmacia) => void;
  onTracarRota: (farmacia: Farmacia) => void;
}

export const CartaoFarmacia = memo(function CartaoFarmacia({
  farmacia,
  selecionada,
  onVerNoMapa,
  onTracarRota,
}: CartaoFarmaciaProps) {
  const theme = useTheme();

  return (
    <Card
      mode="outlined"
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface },
        selecionada && { borderColor: theme.colors.primary, borderWidth: 2 },
      ]}
    >
      <Card.Content>
        <Text variant="titleMedium" style={styles.nome}>
          {farmacia.nome}
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
          {farmacia.endereco}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {farmacia.bairro}
        </Text>
      </Card.Content>
      <Card.Actions>
        <Button
          mode="text"
          icon="map-marker"
          onPress={() => onVerNoMapa(farmacia)}
          contentStyle={styles.botao}
          accessibilityLabel={`Ver ${farmacia.nome} no mapa`}
        >
          Ver no mapa
        </Button>
        <Button
          mode="contained"
          icon="directions"
          onPress={() => onTracarRota(farmacia)}
          contentStyle={styles.botao}
          accessibilityLabel={`Traçar rota até ${farmacia.nome} no Google Maps`}
        >
          Traçar rota
        </Button>
      </Card.Actions>
    </Card>
  );
});

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  nome: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  botao: {
    minHeight: 48,
  },
});
