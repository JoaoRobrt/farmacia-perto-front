import { forwardRef } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import { Card, List, Text, useTheme } from 'react-native-paper';

import { spacing } from '@/theme';

import { MapViewContainerProps } from './MapViewContainer.types';

// react-native-maps não tem suporte à web; aqui as farmácias são exibidas em lista.
export const MapViewContainer = forwardRef<MapView, MapViewContainerProps>(
  ({ farmacias, farmaciaSelecionadaId, onSelectFarmacia }, _ref) => {
    const theme = useTheme();

    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Card style={[styles.noticeCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Card.Content>
            <Text variant="titleMedium" style={[styles.noticeTitle, { color: theme.colors.primary }]}>
              Modo de visualização web
            </Text>
            <Text variant="bodyMedium" style={[styles.noticeText, { color: theme.colors.onSurfaceVariant }]}>
              O mapa está disponível apenas no aplicativo Android. Veja abaixo as farmácias credenciadas encontradas:
            </Text>
          </Card.Content>
        </Card>

        <ScrollView contentContainerStyle={styles.list}>
          {farmacias.map((farmacia) => (
            <Card
              key={farmacia.id}
              style={[
                styles.farmaciaCard,
                { backgroundColor: theme.colors.surface },
                farmacia.id === farmaciaSelecionadaId && { borderColor: theme.colors.primary },
              ]}
              mode="outlined"
              onPress={() => onSelectFarmacia(farmacia)}
              accessibilityLabel={`Farmácia ${farmacia.nome}, ${farmacia.bairro}`}
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
  },
  noticeTitle: {
    fontWeight: 'bold',
  },
  noticeText: {
    marginTop: spacing.xs,
  },
  list: {
    padding: spacing.md,
  },
  farmaciaCard: {
    marginBottom: spacing.sm,
  },
});
