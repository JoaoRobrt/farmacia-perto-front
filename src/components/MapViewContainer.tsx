import { useEffect, useRef, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from 'react-native-paper';

import { DELTA_ZOOM_PONTO, DURACAO_CAMERA_MS, MapViewContainerProps, REGIAO_PADRAO } from './MapViewContainer.types';

const PADDING_ENQUADRAMENTO = { top: 60, right: 60, bottom: 60, left: 60 };

export function MapViewContainer({
  farmacias,
  farmaciaSelecionada,
  localizacaoUsuario,
  onSelectFarmacia,
  onPressMapa,
}: MapViewContainerProps) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const [mapaPronto, setMapaPronto] = useState(false);

  // No Android, chamadas de câmera feitas antes do onMapReady são ignoradas.
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapaPronto || !mapa || farmacias.length === 0) return;

    if (farmacias.length === 1) {
      const [unica] = farmacias;
      mapa.animateToRegion(
        {
          latitude: unica.latitude,
          longitude: unica.longitude,
          latitudeDelta: DELTA_ZOOM_PONTO,
          longitudeDelta: DELTA_ZOOM_PONTO,
        },
        DURACAO_CAMERA_MS
      );
      return;
    }

    mapa.fitToCoordinates(
      farmacias.map((f) => ({ latitude: f.latitude, longitude: f.longitude })),
      { edgePadding: PADDING_ENQUADRAMENTO, animated: true }
    );
  }, [farmacias, mapaPronto]);

  useEffect(() => {
    if (!mapaPronto || !farmaciaSelecionada) return;
    mapRef.current?.animateCamera(
      { center: { latitude: farmaciaSelecionada.latitude, longitude: farmaciaSelecionada.longitude } },
      { duration: DURACAO_CAMERA_MS }
    );
  }, [farmaciaSelecionada, mapaPronto]);

  useEffect(() => {
    if (!mapaPronto || !localizacaoUsuario) return;
    mapRef.current?.animateToRegion(
      { ...localizacaoUsuario, latitudeDelta: DELTA_ZOOM_PONTO * 2, longitudeDelta: DELTA_ZOOM_PONTO * 2 },
      DURACAO_CAMERA_MS
    );
  }, [localizacaoUsuario, mapaPronto]);

  const handlePressMapa = (event: MapPressEvent) => {
    // No iOS o toque em um marcador também dispara o onPress do mapa.
    if (event.nativeEvent.action === 'marker-press') {
      return;
    }
    onPressMapa?.();
  };

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={styles.map}
      initialRegion={REGIAO_PADRAO}
      // O ponto azul só aparece depois que o usuário toca em "Usar minha localização"
      // e concede a permissão.
      showsUserLocation={localizacaoUsuario !== null}
      showsMyLocationButton={false}
      zoomControlEnabled
      // A barra nativa de atalhos do marcador duplicaria o botão "Traçar rota".
      toolbarEnabled={false}
      onMapReady={() => setMapaPronto(true)}
      onPress={handlePressMapa}
    >
      {farmacias.map((farmacia) => (
        <Marker
          key={farmacia.id}
          coordinate={{ latitude: farmacia.latitude, longitude: farmacia.longitude }}
          pinColor={farmacia.id === farmaciaSelecionada?.id ? theme.colors.secondary : theme.colors.primary}
          onPress={() => onSelectFarmacia(farmacia)}
          accessibilityLabel={`Farmácia ${farmacia.nome}, ${farmacia.bairro}`}
          accessibilityRole="button"
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
  },
});
