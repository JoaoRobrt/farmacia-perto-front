import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import type MapView from 'react-native-maps';
import { Button, Card, Snackbar, Text, useTheme } from 'react-native-paper';

import { ErrorView, LoadingView, PainelFarmacia } from '@/components';
import { MapViewContainer } from '@/components/MapViewContainer';
import { useCarregamento } from '@/hooks/useCarregamento';
import { listarFarmacias } from '@/services';
import { spacing } from '@/theme';
import { Farmacia } from '@/types';
import { abrirRotaNoGoogleMaps } from '@/utils/rota';

// Região exibida antes do enquadramento dos marcadores (Campina Grande - PB, município piloto).
const INITIAL_REGION = {
  latitude: -7.2306,
  longitude: -35.8811,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ZOOM_UNICA_FARMACIA = 0.015;
const PADDING_ENQUADRAMENTO = { top: 90, right: 60, bottom: 90, left: 60 };
const DURACAO_CAMERA_MS = 400;

export default function MapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const mapRef = useRef<MapView>(null);

  const { municipioId, nome, uf } = useLocalSearchParams<{
    municipioId?: string;
    nome?: string;
    uf?: string;
  }>();

  const nomeMunicipio = nome ?? '';
  const ufSigla = uf?.toUpperCase() ?? '';
  const titulo = nomeMunicipio && ufSigla ? `${nomeMunicipio} — ${ufSigla}` : 'Mapa';

  const [farmaciaSelecionada, setFarmaciaSelecionada] = useState<Farmacia | null>(null);
  const [alturaPainel, setAlturaPainel] = useState(0);
  const [mapaPronto, setMapaPronto] = useState(false);
  const [erroRota, setErroRota] = useState<string | null>(null);

  const buscarFarmacias = useCallback(
    () => (municipioId ? listarFarmacias(municipioId) : Promise.resolve([])),
    [municipioId]
  );
  const {
    dados: farmacias,
    loading,
    error,
    recarregar,
  } = useCarregamento<Farmacia[]>(buscarFarmacias, [], 'Não foi possível carregar as farmácias credenciadas.');

  // Durante o carregamento o mapa é desmontado; por isso o estado dele é reiniciado.
  const handleTentarNovamente = () => {
    setFarmaciaSelecionada(null);
    setAlturaPainel(0);
    setMapaPronto(false);
    recarregar();
  };

  // Enquadra os marcadores somente após o mapa estar pronto: no Android, chamadas
  // de câmera feitas antes do onMapReady são ignoradas.
  useEffect(() => {
    const mapa = mapRef.current;
    if (!mapaPronto || !mapa || farmacias.length === 0) return;

    if (farmacias.length === 1) {
      const [unica] = farmacias;
      mapa.animateToRegion(
        {
          latitude: unica.latitude,
          longitude: unica.longitude,
          latitudeDelta: ZOOM_UNICA_FARMACIA,
          longitudeDelta: ZOOM_UNICA_FARMACIA,
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

  // Centraliza a farmácia selecionada. O mapPadding inferior (altura do painel) faz
  // o centro ser calculado na área visível acima do painel, sem esconder o marcador.
  useEffect(() => {
    if (!mapaPronto || !farmaciaSelecionada || alturaPainel === 0) return;
    mapRef.current?.animateCamera(
      { center: { latitude: farmaciaSelecionada.latitude, longitude: farmaciaSelecionada.longitude } },
      { duration: DURACAO_CAMERA_MS }
    );
  }, [farmaciaSelecionada, alturaPainel, mapaPronto]);

  const handleLayoutPainel = (event: LayoutChangeEvent) => {
    setAlturaPainel(Math.round(event.nativeEvent.layout.height));
  };

  const handleFecharPainel = () => {
    setFarmaciaSelecionada(null);
    setAlturaPainel(0);
  };

  const handleTracarRota = async (farmacia: Farmacia) => {
    try {
      await abrirRotaNoGoogleMaps(farmacia.latitude, farmacia.longitude);
    } catch {
      setErroRota('Não foi possível abrir o Google Maps. Verifique se há um navegador ou o app instalado.');
    }
  };

  const handleTrocarMunicipio = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ufSigla ? { pathname: '/municipios', params: { uf: ufSigla } } : '/');
  };

  /*
   * PONTO DE EXTENSÃO (FASE FUTURA): botão "Usar minha localização" e ordenação por proximidade.
   * 1. Solicitar permissão de localização somente ao tocar no botão.
   * 2. Obter a posição atual do dispositivo, sem armazená-la além da consulta (LGPD).
   * 3. Mover a câmera até a posição (mapRef.current?.animateCamera).
   * 4. Ordenar as farmácias por proximidade (no app ou na API, decisão em aberto).
   */

  const opcoesHeader = {
    title: titulo,
    headerBackTitle: 'Voltar',
    headerRight: () => (
      <Button
        icon="swap-horizontal"
        mode="text"
        textColor={theme.colors.onPrimary}
        onPress={handleTrocarMunicipio}
        contentStyle={styles.botaoHeader}
        accessibilityLabel="Trocar município"
      >
        Trocar
      </Button>
    ),
  };

  if (!municipioId) {
    return (
      <>
        <Stack.Screen options={opcoesHeader} />
        <ErrorView
          message="Nenhum município foi informado. Volte e selecione um município."
          onRetry={handleTrocarMunicipio}
          retryLabel="Escolher município"
        />
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Stack.Screen options={opcoesHeader} />
        <LoadingView message={`Buscando farmácias em ${nomeMunicipio || 'seu município'}...`} />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Stack.Screen options={opcoesHeader} />
        <ErrorView message={error} onRetry={handleTentarNovamente} />
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={opcoesHeader} />
      <View style={styles.container}>
        <MapViewContainer
          ref={mapRef}
          initialRegion={INITIAL_REGION}
          farmacias={farmacias}
          farmaciaSelecionadaId={farmaciaSelecionada?.id}
          mapPadding={{ top: 0, right: 0, bottom: alturaPainel, left: 0 }}
          onMapReady={() => setMapaPronto(true)}
          onSelectFarmacia={setFarmaciaSelecionada}
          onPressMapa={handleFecharPainel}
        />

        {farmacias.length === 0 && (
          <View style={styles.emptyOverlay}>
            <Card style={[styles.emptyCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyTitle}>
                  Nenhuma farmácia encontrada neste município
                </Text>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Não há farmácias credenciadas cadastradas em {nomeMunicipio} — {ufSigla}.
                </Text>
              </Card.Content>
            </Card>
          </View>
        )}

        {farmaciaSelecionada && (
          <PainelFarmacia
            farmacia={farmaciaSelecionada}
            nomeMunicipio={nomeMunicipio}
            uf={ufSigla}
            onTracarRota={handleTracarRota}
            onFechar={handleFecharPainel}
            onLayout={handleLayoutPainel}
          />
        )}

        <Snackbar
          visible={erroRota !== null}
          onDismiss={() => setErroRota(null)}
          action={{ label: 'OK', onPress: () => setErroRota(null) }}
        >
          {erroRota}
        </Snackbar>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
  },
  emptyCard: {
    width: '100%',
  },
  emptyTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  botaoHeader: {
    minHeight: 48,
  },
});
