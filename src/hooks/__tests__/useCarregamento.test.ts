import { act, renderHook, waitFor } from '@testing-library/react-native';

import { useCarregamento } from '../useCarregamento';

const MENSAGEM_PADRAO = 'Não foi possível carregar.';

function promessaControlada<T>() {
  let resolver!: (valor: T) => void;
  const promessa = new Promise<T>((resolve) => {
    resolver = resolve;
  });
  return { promessa, resolver };
}

describe('useCarregamento', () => {
  it('começa carregando com o valor inicial e expõe os dados ao concluir', async () => {
    const carregar = jest.fn().mockResolvedValue(['PB', 'PE']);

    const { result } = await renderHook(() => useCarregamento(carregar, [] as string[], MENSAGEM_PADRAO));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.dados).toEqual(['PB', 'PE']);
    expect(result.current.error).toBeNull();
    expect(carregar).toHaveBeenCalledTimes(1);
  });

  it('mantém o valor inicial enquanto a busca não termina', async () => {
    const { promessa } = promessaControlada<string[]>();

    const { result } = await renderHook(() => useCarregamento(() => promessa, [] as string[], MENSAGEM_PADRAO));

    expect(result.current.loading).toBe(true);
    expect(result.current.dados).toEqual([]);
  });

  it('expõe a mensagem do erro quando a busca falha', async () => {
    const carregar = jest.fn().mockRejectedValue(new Error('Sem conexão'));

    const { result } = await renderHook(() => useCarregamento(carregar, [], MENSAGEM_PADRAO));

    await waitFor(() => expect(result.current.error).toBe('Sem conexão'));
    expect(result.current.loading).toBe(false);
  });

  it('usa a mensagem padrão quando o erro não tem mensagem', async () => {
    const carregar = jest.fn().mockRejectedValue('falha desconhecida');

    const { result } = await renderHook(() => useCarregamento(carregar, [], MENSAGEM_PADRAO));

    await waitFor(() => expect(result.current.error).toBe(MENSAGEM_PADRAO));
  });

  it('recarregar limpa o erro, volta a carregar e repete a busca', async () => {
    const carregar = jest.fn().mockRejectedValueOnce(new Error('Sem conexão')).mockResolvedValueOnce(['PB']);

    const { result } = await renderHook(() => useCarregamento(carregar, [] as string[], MENSAGEM_PADRAO));
    await waitFor(() => expect(result.current.error).toBe('Sem conexão'));

    await act(async () => {
      result.current.recarregar();
    });

    await waitFor(() => expect(result.current.dados).toEqual(['PB']));
    expect(result.current.error).toBeNull();
    expect(carregar).toHaveBeenCalledTimes(2);
  });

  it('ignora a resposta de uma busca antiga quando os parâmetros mudam', async () => {
    const antiga = promessaControlada<string[]>();
    const nova = promessaControlada<string[]>();
    const buscarPB = () => antiga.promessa;
    const buscarPE = () => nova.promessa;

    const { result, rerender } = await renderHook(
      ({ carregar }: { carregar: () => Promise<string[]> }) => useCarregamento(carregar, [] as string[], MENSAGEM_PADRAO),
      { initialProps: { carregar: buscarPB } }
    );
    await rerender({ carregar: buscarPE });

    await act(async () => {
      nova.resolver(['Recife']);
    });
    await act(async () => {
      antiga.resolver(['Campina Grande']);
    });

    expect(result.current.dados).toEqual(['Recife']);
  });
});
