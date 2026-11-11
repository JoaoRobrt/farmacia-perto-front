import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { Avatar, Divider, List, Text, useTheme } from 'react-native-paper';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CampoBusca, EmptyView, ErrorView, LoadingView } from '@/components';
import { useCarregamento } from '@/hooks/useCarregamento';
import { listarEstados } from '@/services';
import { spacing } from '@/theme';
import { Estado } from '@/types';
import { normalizarBusca } from '@/utils/texto';

export default function SelectingStateScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [searchQuery, setSearchQuery] = useState('');
  const {
    dados: estados,
    loading,
    error,
    recarregar,
  } = useCarregamento<Estado[]>(listarEstados, [], 'Não foi possível carregar a lista de estados.');

  const estadosFiltrados = useMemo(() => {
    const queryFormatada = normalizarBusca(searchQuery);
    if (!queryFormatada) {
      return estados;
    }
    return estados.filter(
      (estado) =>
        normalizarBusca(estado.nome).includes(queryFormatada) ||
        normalizarBusca(estado.sigla).includes(queryFormatada)
    );
  }, [estados, searchQuery]);

  const handleSelectEstado = (sigla: string) => {
    router.push({ pathname: '/municipios', params: { uf: sigla } });
  };

  const renderContent = () => {
    if (loading) {
      return <LoadingView message="Carregando lista de estados..." />;
    }

    if (error) {
      return <ErrorView message={error} onRetry={recarregar} />;
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
        ItemSeparatorComponent={Divider}
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
                labelStyle={[styles.avatarLabel, { color: theme.colors.primary }]}
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
        <View
          style={[
            styles.headerCard,
            { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant },
          ]}
        >
          <Text variant="bodyLarge" style={[styles.headerDescription, { color: theme.colors.onSurface }]}>
            Encontre farmácias do Programa Farmácia Popular. Escolha seu estado para começar.
          </Text>
          <CampoBusca
            placeholder="Buscar estado por nome ou sigla..."
            onChangeText={setSearchQuery}
            value={searchQuery}
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
  },
  headerDescription: {
    marginBottom: spacing.md,
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
  avatarLabel: {
    fontWeight: 'bold',
  },
});
