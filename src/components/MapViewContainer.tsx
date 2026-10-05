import React, { forwardRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';

import { Farmacia } from '@/types';

let MapView: any = null;
let Marker: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

interface MapViewContainerProps {
  initialRegion: any;
  farmacias: Farmacia[];
  onSelectFarmacia: (farmacia: Farmacia) => void;
}

export const MapViewContainer = forwardRef<any, MapViewContainerProps>(
  ({ initialRegion, farmacias, onSelectFarmacia }, ref) => {
    const theme = useTheme();

    if (Platform.OS === 'web' || !MapView) {
      return null;
    }

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
