import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Divider, List, Text, useTheme } from 'react-native-paper';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoBusca, EmptyView, ErrorView, LoadingView } from '@/components';
import { listarMunicipios } from '@/services';
import { spacing } from '@/theme';
import { Municipio } from '@/types';

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

const ITEM_HEIGHT = 57; // 56px item + 1px divider

export default function SelectingMunicipalityScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { uf } = useLocalSearchParams<{ uf?: string }>();

  const ufSigla = (uf || 'PB').toUpperCase();

  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarMunicipios = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listarMunicipios(ufSigla);
      setMunicipios(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar os municípios.');
    } finally {
      setLoading(false);
    }
  }, [ufSigla]);

  useEffect(() => {
    carregarMunicipios();
  }, [carregarMunicipios]);

  const municipiosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return municipios;
    }
    const queryFormatada = removeAccents(searchQuery);
    return municipios.filter((m) => removeAccents(m.nome).includes(queryFormatada));
  }, [municipios, searchQuery]);

  const handleSelectMunicipio = (item: Municipio) => {
    router.push({
      pathname: '/mapa' as any,
      params: {
        municipioId: item.id,
        nome: item.nome,
        uf: item.uf,
      },
    });
  };

  const getItemLayout = useCallback(
    (_data: any, index: number) => ({
      length: ITEM_HEIGHT,
      offset: ITEM_HEIGHT * index,
      index,
    }),
    []
  );

  const renderContent = () => {
    if (loading) {
      return <LoadingView message={`Carregando municípios de ${ufSigla}...`} />;
    }

    if (error) {
      return <ErrorView message={error} onRetry={carregarMunicipios} />;
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
        ItemSeparatorComponent={() => <Divider />}
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
          title: `Municípios — ${ufSigla}`,
          headerBackTitle: 'Voltar',
        }}
      />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
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
    borderBottomColor: '#E0E2EC',
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
