import { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from 'react-native-paper';

import { MapViewContainerProps } from './MapViewContainer.types';

export const MapViewContainer = forwardRef<MapView, MapViewContainerProps>(
  (
    { initialRegion, farmacias, farmaciaSelecionadaId, mapPadding, onMapReady, onSelectFarmacia, onPressMapa },
    ref
  ) => {
    const theme = useTheme();

    const handlePressMapa = (event: MapPressEvent) => {
      // No iOS o toque em um marcador também dispara o onPress do mapa.
      if (event.nativeEvent.action === 'marker-press') {
        return;
      }
      onPressMapa?.();
    };

    return (
      <MapView
        ref={ref}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={initialRegion}
        mapPadding={mapPadding}
        showsUserLocation={false}
        showsMyLocationButton={false}
        zoomControlEnabled
        // A barra nativa de atalhos do marcador (abrir no Maps) duplicaria o botão
        // "Traçar rota" e ficaria sobreposta ao painel de detalhes.
        toolbarEnabled={false}
        onMapReady={onMapReady}
        onPress={handlePressMapa}
      >
        {farmacias.map((farmacia) => (
          <Marker
            key={farmacia.id}
            coordinate={{ latitude: farmacia.latitude, longitude: farmacia.longitude }}
            pinColor={farmacia.id === farmaciaSelecionadaId ? theme.colors.secondary : theme.colors.primary}
            onPress={() => onSelectFarmacia(farmacia)}
            accessibilityLabel={`Farmácia ${farmacia.nome}, ${farmacia.bairro}`}
            accessibilityRole="button"
          />
        ))}
      </MapView>
    );
  }
);

MapViewContainer.displayName = 'MapViewContainer';

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
