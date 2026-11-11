import { useCallback, useEffect, useState } from 'react';

import { mensagemDeErro } from '@/utils/texto';

interface EstadoCarregamento<T> {
  dados: T;
  loading: boolean;
  error: string | null;
}

/**
 * Executa uma busca assíncrona ao montar a tela (e quando `carregar` muda) e expõe
 * os estados de carregando/erro usados pelas telas de dados. `carregar` deve ser
 * estável (useCallback) para não disparar buscas repetidas.
 */
export function useCarregamento<T>(carregar: () => Promise<T>, valorInicial: T, mensagemPadrao: string) {
  const [estado, setEstado] = useState<EstadoCarregamento<T>>({
    dados: valorInicial,
    loading: true,
    error: null,
  });
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let ativo = true;
    carregar().then(
      (dados) => {
        if (ativo) setEstado({ dados, loading: false, error: null });
      },
      (erro: unknown) => {
        if (ativo) setEstado((atual) => ({ ...atual, loading: false, error: mensagemDeErro(erro, mensagemPadrao) }));
      }
    );
    // Ignora respostas de buscas antigas quando os parâmetros mudam ou a tela é desmontada.
    return () => {
      ativo = false;
    };
  }, [carregar, mensagemPadrao, tentativa]);

  const recarregar = useCallback(() => {
    setEstado((atual) => ({ ...atual, loading: true, error: null }));
    setTentativa((t) => t + 1);
  }, []);

  return { ...estado, recarregar };
}
