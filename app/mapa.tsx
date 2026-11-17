import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { FlatList, LayoutChangeEvent, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Button, FAB, Snackbar, Text, useTheme } from 'react-native-paper';

import { CartaoFarmacia, EmptyView, ErrorView, LoadingView, PainelFarmacia } from '@/components';
import { MapViewContainer } from '@/components/MapViewContainer';
import { useCarregamento } from '@/hooks/useCarregamento';
import { Coordenada, listarFarmacias, obterLocalizacaoAtual } from '@/services';
import { spacing } from '@/theme';
import { Farmacia } from '@/types';
import { abrirRotaNoGoogleMaps } from '@/utils/rota';
import { mensagemDeErro } from '@/utils/texto';

// A partir desta largura (tablet, web) os detalhes abrem em painel lateral ao lado do mapa.
const LARGURA_MINIMA_PAINEL_LATERAL = 768;
const ALTURA_MINIMA_MAPA = 280;
const PROPORCAO_ALTURA_MAPA = 0.55;

export default function MapScreen() {
  const theme = useTheme();
  const router = useRouter();
  const listaRef = useRef<FlatList<Farmacia>>(null);
  const { width, height } = useWindowDimensions();

  const telaLarga = width >= LARGURA_MINIMA_PAINEL_LATERAL;
  const alturaMapa = Math.max(ALTURA_MINIMA_MAPA, Math.round(height * PROPORCAO_ALTURA_MAPA));

  const { municipioId, nome, uf } = useLocalSearchParams<{
    municipioId?: string;
    nome?: string;
    uf?: string;
  }>();

  const nomeMunicipio = nome ?? '';
  const ufSigla = uf?.toUpperCase() ?? '';
  const titulo = nomeMunicipio && ufSigla ? `${nomeMunicipio} — ${ufSigla}` : 'Mapa';

  const [farmaciaSelecionada, setFarmaciaSelecionada] = useState<Farmacia | null>(null);
  const [alturaPainelInferior, setAlturaPainelInferior] = useState(0);
  const [localizacaoUsuario, setLocalizacaoUsuario] = useState<Coordenada | null>(null);
  const [buscandoLocalizacao, setBuscandoLocalizacao] = useState(false);
  const [rolagemHabilitada, setRolagemHabilitada] = useState(true);
  const [mensagem, setMensagem] = useState<string | null>(null);

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

  const handleTentarNovamente = () => {
    setFarmaciaSelecionada(null);
    recarregar();
  };

  const handleFecharPainel = useCallback(() => {
    setFarmaciaSelecionada(null);
    setAlturaPainelInferior(0);
  }, []);

  const handleTracarRota = useCallback(async (farmacia: Farmacia) => {
    try {
      await abrirRotaNoGoogleMaps(farmacia.latitude, farmacia.longitude);
    } catch {
      setMensagem('Não foi possível abrir o Google Maps. Verifique se há um navegador ou o app instalado.');
    }
  }, []);

  const handleVerNoMapa = useCallback((farmacia: Farmacia) => {
    setFarmaciaSelecionada(farmacia);
    listaRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  // A permissão só é pedida quando o usuário toca no botão; a posição fica apenas em memória.
  const handleUsarLocalizacao = async () => {
    setBuscandoLocalizacao(true);
    try {
      setLocalizacaoUsuario(await obterLocalizacaoAtual());
    } catch (err) {
      setMensagem(mensagemDeErro(err, 'Não foi possível obter sua localização.'));
    } finally {
      setBuscandoLocalizacao(false);
    }
  };

  const handleTrocarMunicipio = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(ufSigla ? { pathname: '/municipios', params: { uf: ufSigla } } : '/');
  };

  const handleLayoutPainelInferior = (event: LayoutChangeEvent) => {
    setAlturaPainelInferior(Math.round(event.nativeEvent.layout.height));
  };

  // No celular, gestos sobre o mapa não devem rolar a lista ao mesmo tempo.
  const bloqueioRolagem =
    Platform.OS === 'web'
      ? {}
      : {
          onTouchStart: () => setRolagemHabilitada(false),
          onTouchEnd: () => setRolagemHabilitada(true),
          onTouchCancel: () => setRolagemHabilitada(true),
        };

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

  const painelInferiorAberto = !telaLarga && farmaciaSelecionada !== null;

  const cabecalhoLista = (
    <>
      <View style={[styles.areaMapa, { height: alturaMapa }]}>
        <View style={styles.mapa} {...bloqueioRolagem}>
          <MapViewContainer
            farmacias={farmacias}
            farmaciaSelecionada={farmaciaSelecionada}
            localizacaoUsuario={localizacaoUsuario}
            onSelectFarmacia={setFarmaciaSelecionada}
            onPressMapa={handleFecharPainel}
          />
          <FAB
            icon="crosshairs-gps"
            size="small"
            loading={buscandoLocalizacao}
            disabled={buscandoLocalizacao}
            onPress={handleUsarLocalizacao}
            style={[styles.botaoLocalizacao, { backgroundColor: theme.colors.surface }]}
            color={theme.colors.primary}
            accessibilityLabel="Usar minha localização"
          />
        </View>
        {telaLarga && farmaciaSelecionada && (
          <PainelFarmacia
            farmacia={farmaciaSelecionada}
            nomeMunicipio={nomeMunicipio}
            uf={ufSigla}
            variante="lateral"
            onTracarRota={handleTracarRota}
            onFechar={handleFecharPainel}
          />
        )}
      </View>

      {farmacias.length > 0 && (
        <View style={styles.tituloLista}>
          <Text variant="titleMedium" style={styles.tituloListaTexto} accessibilityRole="header">
            Farmácias credenciadas
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {farmacias.length === 1 ? '1 farmácia encontrada' : `${farmacias.length} farmácias encontradas`}
          </Text>
        </View>
      )}
    </>
  );

  return (
    <>
      <Stack.Screen options={opcoesHeader} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <FlatList
          ref={listaRef}
          data={farmacias}
          keyExtractor={(item) => item.id}
          scrollEnabled={rolagemHabilitada}
          ListHeaderComponent={cabecalhoLista}
          contentContainerStyle={{ paddingBottom: (painelInferiorAberto ? alturaPainelInferior : 0) + spacing.md }}
          ListEmptyComponent={
            <EmptyView
              title="Nenhuma farmácia encontrada neste município"
              message={`Não há farmácias credenciadas cadastradas em ${nomeMunicipio} — ${ufSigla}.`}
            />
          }
          renderItem={({ item }) => (
            <CartaoFarmacia
              farmacia={item}
              selecionada={item.id === farmaciaSelecionada?.id}
              onVerNoMapa={handleVerNoMapa}
              onTracarRota={handleTracarRota}
            />
          )}
        />

        {painelInferiorAberto && (
          <PainelFarmacia
            farmacia={farmaciaSelecionada}
            nomeMunicipio={nomeMunicipio}
            uf={ufSigla}
            variante="inferior"
            onTracarRota={handleTracarRota}
            onFechar={handleFecharPainel}
            onLayout={handleLayoutPainelInferior}
          />
        )}

        <Snackbar
          visible={mensagem !== null}
          onDismiss={() => setMensagem(null)}
          action={{ label: 'OK', onPress: () => setMensagem(null) }}
        >
          {mensagem}
        </Snackbar>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  areaMapa: {
    flexDirection: 'row',
  },
  mapa: {
    flex: 1,
  },
  botaoLocalizacao: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  tituloLista: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  tituloListaTexto: {
    fontWeight: 'bold',
  },
  botaoHeader: {
    minHeight: 48,
  },
});
