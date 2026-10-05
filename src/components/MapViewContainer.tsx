import React, { forwardRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { useTheme } from 'react-native-paper';

import { Farmacia } from '@/types';

interface MapViewContainerProps {
  initialRegion: Region;
  farmacias: Farmacia[];
  onSelectFarmacia: (farmacia: Farmacia) => void;
}

export const MapViewContainer = forwardRef<MapView, MapViewContainerProps>(
  ({ initialRegion, farmacias, onSelectFarmacia }, ref) => {
    const theme = useTheme();

    return (
      <View style={styles.container}>
        <MapView
          ref={ref}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={initialRegion}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomControlEnabled={true}
          toolbarEnabled={false}
        >
          {farmacias.map((farmacia) => (
            <Marker
              key={farmacia.id}
              coordinate={{
                latitude: farmacia.latitude,
                longitude: farmacia.longitude,
              }}
              title={farmacia.nome}
              description={`${farmacia.endereco} - ${farmacia.bairro}`}
              pinColor={theme.colors.primary}
              onPress={() => onSelectFarmacia(farmacia)}
            />
          ))}
        </MapView>
      </View>
    );
  }
);

MapViewContainer.displayName = 'MapViewContainer';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
});
