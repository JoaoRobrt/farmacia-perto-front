import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Card, Text, useTheme } from 'react-native-paper';
import { Stack, useLocalSearchParams } from 'expo-router';

import { ErrorView, LoadingView } from '@/components';
import { listarFarmacias } from '@/services';
import { spacing } from '@/theme';
import { Farmacia } from '@/types';

// Região inicial padrão de fallback (Campina Grande - PB)
const INITIAL_REGION = {
  latitude: -7.2306,
  longitude: -35.8811,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const theme = useTheme();
  const mapRef = useRef<MapView | null>(null);

  const { municipioId, nome, uf } = useLocalSearchParams<{
    municipioId?: string;
    nome?: string;
    uf?: string;
  }>();

  const idMunicipio = municipioId || 'pb-campina-grande';
  const nomeMunicipio = nome || 'Campina Grande';
  const ufSigla = (uf || 'PB').toUpperCase();

  const [farmacias, setFarmacias] = useState<Farmacia[]>([]);

  // Estado para armazenar a farmácia selecionada ao tocar em um marcador
  // (será consumido pelo Bottom Sheet no próximo prompt)
  const [farmaciaSelecionada, setFarmaciaSelecionada] = useState<Farmacia | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarFarmacias = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setFarmaciaSelecionada(null);
      const data = await listarFarmacias(idMunicipio);
      setFarmacias(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar as farmácias credenciadas.');
    } finally {
      setLoading(false);
    }
  }, [idMunicipio]);

  useEffect(() => {
    carregarFarmacias();
  }, [carregarFarmacias]);

  // Efeito para enquadrar os marcadores da câmera após carregar as farmácias
  useEffect(() => {
    if (loading || error || !mapRef.current) return;

    if (farmacias.length === 1) {
      // Caso haja 1 única farmácia
      const single = farmacias[0];
      mapRef.current.animateToRegion(
        {
          latitude: single.latitude,
          longitude: single.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        1000
      );
    } else if (farmacias.length > 1) {
      // Caso haja múltiplas farmácias
      const coordinates = farmacias.map((f) => ({
        latitude: f.latitude,
        longitude: f.longitude,
      }));
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 90, right: 60, bottom: 90, left: 60 },
        animated: true,
      });
    }
  }, [farmacias, loading, error]);

  /*
   * PONTO DE EXTENSÃO (FASE FUTURA):
   * Botão "Usar minha localização" e ordenação por proximidade.
   * 
   * const handleUseMyLocation = async () => {
   *   // 1. Solicitar permissão de geolocalização ao usuário (Location.requestForegroundPermissionsAsync)
   *   // 2. Obter latitude e longitude atuais do dispositivo (Location.getCurrentPositionAsync)
   *   // 3. Mover a câmera do mapa para a posição do usuário (mapRef.current?.animateToRegion)
   *   // 4. Filtrar/ordenar farmácias por proximidade até o usuário.
   * };
   */

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: `${nomeMunicipio} — ${ufSigla}` }} />
        <LoadingView message={`Buscando farmácias em ${nomeMunicipio}...`} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={{ title: `${nomeMunicipio} — ${ufSigla}` }} />
        <ErrorView message={error} onRetry={carregarFarmacias} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `${nomeMunicipio} — ${ufSigla}`,
          headerBackTitle: 'Voltar',
        }}
      />
      <View style={styles.container}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={INITIAL_REGION}
          showsUserLocation={false}
          showsMyLocationButton={false}
          zoomControlEnabled={true}
          // Desativamos a toolbar nativa do Google Maps para evitar que os botões nativos
          // de "Abrir no Maps / Rota" se sobreponham e conflitem com o Bottom Sheet de detalhes
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
              onPress={() => setFarmaciaSelecionada(farmacia)}
            />
          ))}
        </MapView>

        {farmacias.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Card style={styles.emptyCard} mode="elevated">
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Nenhuma farmácia encontrada
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.outline }}>
                  Não há farmácias credenciadas cadastradas no município de {nomeMunicipio} — {ufSigla}.
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  emptyOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
  },
  emptyCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
});
