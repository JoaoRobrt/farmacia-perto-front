import { useCallback, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Divider, List, Text, useTheme } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoBusca, EmptyView, ErrorView, LoadingView } from '@/components';
import { useCarregamento } from '@/hooks/useCarregamento';
import { listarMunicipios } from '@/services';
import { spacing } from '@/theme';
import { Municipio } from '@/types';
import { normalizarBusca } from '@/utils/texto';

// Altura fixa do item (56) + divisor (1), usada pelo getItemLayout.
const ITEM_HEIGHT = 57;

export default function SelectingMunicipalityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uf } = useLocalSearchParams<{ uf?: string }>();

  const ufSigla = uf?.toUpperCase() ?? '';

  const [searchQuery, setSearchQuery] = useState('');

  const buscarMunicipios = useCallback(
    () => (ufSigla ? listarMunicipios(ufSigla) : Promise.resolve([])),
    [ufSigla]
  );
  const {
    dados: municipios,
    loading,
    error,
    recarregar,
  } = useCarregamento<Municipio[]>(buscarMunicipios, [], 'Não foi possível carregar os municípios.');

  const municipiosFiltrados = useMemo(() => {
    const queryFormatada = normalizarBusca(searchQuery);
    if (!queryFormatada) {
      return municipios;
    }
    return municipios.filter((m) => normalizarBusca(m.nome).includes(queryFormatada));
  }, [municipios, searchQuery]);

  const handleSelectMunicipio = (item: Municipio) => {
    router.push({
      pathname: '/mapa',
      params: { municipioId: item.id, nome: item.nome, uf: item.uf },
    });
  };

  const getItemLayout = useCallback(
    (_data: ArrayLike<Municipio> | null | undefined, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderContent = () => {
    if (!ufSigla) {
      return (
        <ErrorView
          message="Nenhum estado foi informado. Volte e selecione um estado."
          onRetry={() => router.replace('/')}
          retryLabel="Escolher estado"
        />
      );
    }

    if (loading) {
      return <LoadingView message={`Carregando municípios de ${ufSigla}...`} />;
    }

    if (error) {
      return <ErrorView message={error} onRetry={recarregar} />;
    }

    return (
      <FlatList
        data={municipiosFiltrados}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={10}
        getItemLayout={getItemLayout}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
          municipiosFiltrados.length === 0 && styles.emptyContainer,
        ]}
        ItemSeparatorComponent={Divider}
        ListEmptyComponent={
          <EmptyView
            title="Nenhum município encontrado"
            message={
              searchQuery.trim()
                ? `Não encontramos nenhum município em ${ufSigla} correspondente a "${searchQuery}".`
                : `Nenhum município cadastrado para o estado ${ufSigla}.`
            }
          />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            titleStyle={styles.itemTitle}
            style={styles.listItem}
            left={(props) => <List.Icon {...props} icon="city-variant-outline" color={theme.colors.primary} />}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => handleSelectMunicipio(item)}
            accessibilityLabel={`Selecionar município ${item.nome}`}
            accessibilityRole="button"
          />
        )}
      />
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: ufSigla ? `Municípios — ${ufSigla}` : 'Municípios',
          headerBackTitle: 'Voltar',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View
          style={[
            styles.headerCard,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
          ]}
        >
          <Text variant="bodyMedium" style={[styles.headerSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Selecione o município desejado no estado de {ufSigla}
          </Text>
          <CampoBusca
            placeholder="Buscar município por nome..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            accessibilityLabel={`Campo de busca por município em ${ufSigla}`}
          />
        </View>

        {renderContent()}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerCard: {
    padding: spacing.md,
    borderBottomWidth: 1,
  },
  headerSubtitle: {
    marginBottom: spacing.sm,
  },
  listContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    justifyContent: 'center',
  },
  listItem: {
    minHeight: 56,
    justifyContent: 'center',
    paddingVertical: spacing.xs,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
