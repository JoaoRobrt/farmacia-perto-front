import { render } from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { theme } from '@/theme';
import { Farmacia } from '@/types';

const METRICAS_TELA = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

function Provedores({ children }: { children: ReactNode }) {
  return (
    <SafeAreaProvider initialMetrics={METRICAS_TELA}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </SafeAreaProvider>
  );
}

/** Renderiza com os mesmos provedores do app (tema Paper e safe area). */
export function renderizar(ui: ReactElement) {
  return render(ui, { wrapper: Provedores });
}

export function criarFarmacia(dados: Partial<Farmacia> = {}): Farmacia {
  return {
    id: 'cg-01',
    nome: 'Farmácia Central Popular',
    endereco: 'Rua Venâncio Neiva, 120',
    bairro: 'Centro',
    municipioId: 'pb-campina-grande',
    latitude: -7.2215,
    longitude: -35.883,
    ...dados,
  };
}
