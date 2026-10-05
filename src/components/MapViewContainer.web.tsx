import React, { forwardRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Card, List, Text, useTheme } from 'react-native-paper';

import { spacing } from '@/theme';
import { Farmacia } from '@/types';

interface MapViewContainerProps {
  initialRegion: any;
  farmacias: Farmacia[];
  onSelectFarmacia: (farmacia: Farmacia) => void;
}

export const MapViewContainer = forwardRef<any, MapViewContainerProps>(
  ({ farmacias, onSelectFarmacia }, _ref) => {
    const theme = useTheme();

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={styles.noticeCard}>
          <Card.Content>
            <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: 'bold' }}>
              Modo de Visualização Web
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}>
              O Google Maps nativo (`react-native-maps`) é voltado para o Android. Na web, veja abaixo as farmácias credenciadas encontradas:
            </Text>
          </Card.Content>
        </Card>

        <ScrollView contentContainerStyle={{ padding: spacing.md }}>
          {farmacias.map((farmacia) => (
            <Card
              key={farmacia.id}
              style={styles.farmaciaCard}
              mode="outlined"
              onPress={() => onSelectFarmacia(farmacia)}
            >
              <Card.Title
                title={farmacia.nome}
                subtitle={`${farmacia.endereco} — ${farmacia.bairro}`}
                left={(props) => <List.Icon {...props} icon="map-marker-radius" color={theme.colors.primary} />}
              />
            </Card>
          ))}
        </ScrollView>
      </View>
    );
  }
);

MapViewContainer.displayName = 'MapViewContainer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  noticeCard: {
    margin: spacing.md,
    backgroundColor: '#EBF2FF',
  },
  farmaciaCard: {
    marginBottom: spacing.sm,
    backgroundColor: '#FFFFFF',
  },
});
