import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Divider, List, Searchbar, Text, useTheme } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyView, ErrorView, LoadingView } from '@/components';
import { listarEstados } from '@/services';
import { borderRadius, spacing } from '@/theme';
import { Estado } from '@/types';

function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function SelectingStateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [estados, setEstados] = useState<Estado[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarEstados = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listarEstados();
      setEstados(data);
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar a lista de estados.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarEstados();
  }, []);

  const estadosFiltrados = useMemo(() => {
    if (!searchQuery.trim()) {
      return estados;
    }
    const queryFormatada = removeAccents(searchQuery);
    return estados.filter((estado) => {
      const nomeFormatado = removeAccents(estado.nome);
      const siglaFormatada = removeAccents(estado.sigla);
      return nomeFormatado.includes(queryFormatada) || siglaFormatada.includes(queryFormatada);
    });
  }, [estados, searchQuery]);

  const handleSelectEstado = (sigla: string) => {
    router.push({
      pathname: '/municipios' as any,
      params: { uf: sigla },
    });
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingView message="Carregando lista de estados..." />;
    }

    if (error) {
      return <ErrorView message={error} onRetry={carregarEstados} />;
    }

    return (
      <FlatList
        data={estadosFiltrados}
        keyExtractor={(item) => item.sigla}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + spacing.md },
          estadosFiltrados.length === 0 && styles.emptyContainer,
        ]}
        ItemSeparatorComponent={() => <Divider />}
        ListEmptyComponent={
          <EmptyView
            title="Nenhum estado encontrado"
            message={`Não encontramos nenhum estado correspondente a "${searchQuery}".`}
          />
        }
        renderItem={({ item }) => (
          <List.Item
            title={item.nome}
            titleStyle={styles.itemTitle}
            style={styles.listItem}
            left={() => (
              <Avatar.Text
                size={40}
                label={item.sigla}
                style={[styles.avatar, { backgroundColor: theme.colors.primaryContainer }]}
                labelStyle={{ color: theme.colors.primary, fontWeight: 'bold' }}
              />
            )}
            right={(props) => <List.Icon {...props} icon="chevron-right" />}
            onPress={() => handleSelectEstado(item.sigla)}
            accessibilityLabel={`Selecionar estado ${item.nome}, ${item.sigla}`}
            accessibilityRole="button"
          />
        )}
      />
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Farmácia Perto' }} />
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.headerCard, { backgroundColor: theme.colors.surface }]}>
          <Text variant="bodyLarge" style={[styles.headerDescription, { color: theme.colors.onSurface }]}>
            Encontre farmácias do Programa Farmácia Popular. Escolha seu estado para começar.
          </Text>
          <Searchbar
            placeholder="Buscar estado por nome ou sigla..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
            elevation={1}
            accessibilityLabel="Campo de busca por nome ou sigla do estado"
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
  headerDescription: {
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  searchbar: {
    borderRadius: borderRadius.md,
    backgroundColor: '#F1F3F9',
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
  avatar: {
    alignSelf: 'center',
    marginLeft: spacing.xs,
  },
});
