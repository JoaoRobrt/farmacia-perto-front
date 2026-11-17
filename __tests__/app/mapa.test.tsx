import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import MapScreen from '@/../app/mapa';
import { listarFarmacias, obterLocalizacaoAtual } from '@/services';
import { criarFarmacia, renderizar } from '@/testes/renderizar';
import { abrirRotaNoGoogleMaps } from '@/utils/rota';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn() };
let mockParams: { municipioId?: string; nome?: string; uf?: string } = {};

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    Stack: {
      Screen: ({ options }: any) =>
        React.createElement(React.Fragment, null, React.createElement(Text, null, options?.title), options?.headerRight?.()),
    },
  };
});

jest.mock('@/services', () => ({ listarFarmacias: jest.fn(), obterLocalizacaoAtual: jest.fn() }));
jest.mock('@/utils/rota', () => ({ abrirRotaNoGoogleMaps: jest.fn() }));

// Substitui o mapa nativo por botões que simulam os marcadores e o toque em área vazia.
jest.mock('@/components/MapViewContainer', () => {
  const React = jest.requireActual('react');
  const { Pressable, Text } = jest.requireActual('react-native');
  return {
    MapViewContainer: ({ farmacias, localizacaoUsuario, onSelectFarmacia, onPressMapa }: any) =>
      React.createElement(
        React.Fragment,
        null,
        farmacias.map((f: any) =>
          React.createElement(Pressable, {
            key: f.id,
            accessibilityLabel: `Marcador ${f.nome}`,
            onPress: () => onSelectFarmacia(f),
          })
        ),
        React.createElement(Pressable, { accessibilityLabel: 'Área vazia do mapa', onPress: onPressMapa }),
        localizacaoUsuario &&
          React.createElement(Text, null, `Você está em ${localizacaoUsuario.latitude},${localizacaoUsuario.longitude}`)
      ),
  };
});

const listarFarmaciasMock = listarFarmacias as jest.Mock;
const obterLocalizacaoMock = obterLocalizacaoAtual as jest.Mock;
const abrirRotaMock = abrirRotaNoGoogleMaps as jest.Mock;

const centro = criarFarmacia({ id: 'cg-01', nome: 'Farmácia Centro', bairro: 'Centro' });
const prata = criarFarmacia({
  id: 'cg-02',
  nome: 'Farmácia Prata',
  endereco: 'Av. Floriano Peixoto, 850',
  bairro: 'Prata',
  latitude: -7.226,
  longitude: -35.89,
});

const AVISO_ESTOQUE = 'A localização não confirma estoque de medicamentos.';

async function renderizarMapaCarregado() {
  await renderizar(<MapScreen />);
  await screen.findByText('2 farmácias encontradas');
}

describe('Tela do mapa', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { municipioId: 'pb-campina-grande', nome: 'Campina Grande', uf: 'pb' };
    listarFarmaciasMock.mockResolvedValue([centro, prata]);
    abrirRotaMock.mockResolvedValue(undefined);
  });

  describe('carregamento', () => {
    it('mostra o carregamento enquanto a busca não termina', async () => {
      listarFarmaciasMock.mockReturnValue(new Promise(() => {}));
      await renderizar(<MapScreen />);

      expect(screen.getByText('Buscando farmácias em Campina Grande...')).toBeOnTheScreen();
    });

    it('busca as farmácias do município e lista as encontradas', async () => {
      await renderizar(<MapScreen />);

      expect(screen.getByText('Campina Grande — PB')).toBeOnTheScreen();
      expect(await screen.findByText('2 farmácias encontradas')).toBeOnTheScreen();
      expect(screen.getByText('Farmácia Centro')).toBeOnTheScreen();
      expect(screen.getByText('Farmácia Prata')).toBeOnTheScreen();
      expect(listarFarmaciasMock).toHaveBeenCalledWith('pb-campina-grande');
    });

    it('usa o singular quando há uma única farmácia', async () => {
      listarFarmaciasMock.mockResolvedValue([centro]);
      await renderizar(<MapScreen />);

      expect(await screen.findByText('1 farmácia encontrada')).toBeOnTheScreen();
    });

    it('informa quando o município não tem farmácias credenciadas', async () => {
      listarFarmaciasMock.mockResolvedValue([]);
      await renderizar(<MapScreen />);

      expect(await screen.findByText('Nenhuma farmácia encontrada neste município')).toBeOnTheScreen();
      expect(
        screen.getByText('Não há farmácias credenciadas cadastradas em Campina Grande — PB.')
      ).toBeOnTheScreen();
    });

    it('mostra o erro e recarrega ao tocar em "Tentar novamente"', async () => {
      listarFarmaciasMock.mockRejectedValueOnce(new Error('Falha ao buscar farmácias.'));
      await renderizar(<MapScreen />);

      expect(await screen.findByText('Falha ao buscar farmácias.')).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Tentar novamente'));

      expect(await screen.findByText('2 farmácias encontradas')).toBeOnTheScreen();
    });

    it('sem município na rota, não busca nada e oferece escolher um município', async () => {
      mockParams = {};
      mockRouter.canGoBack.mockReturnValue(true);
      await renderizar(<MapScreen />);

      expect(
        screen.getByText('Nenhum município foi informado. Volte e selecione um município.')
      ).toBeOnTheScreen();

      await fireEvent.press(screen.getByText('Escolher município'));

      expect(mockRouter.back).toHaveBeenCalled();
      expect(listarFarmaciasMock).not.toHaveBeenCalled();
    });
  });

  describe('painel de detalhes', () => {
    it('abre ao tocar em um marcador, com município/UF e aviso de estoque', async () => {
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Marcador Farmácia Prata'));

      expect(screen.getByText('Prata — Campina Grande/PB')).toBeOnTheScreen();
      expect(screen.getByText(AVISO_ESTOQUE)).toBeOnTheScreen();
    });

    it('troca a farmácia exibida ao tocar em outro marcador', async () => {
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Marcador Farmácia Prata'));
      await fireEvent.press(screen.getByLabelText('Marcador Farmácia Centro'));

      expect(screen.getByText('Centro — Campina Grande/PB')).toBeOnTheScreen();
      expect(screen.queryByText('Prata — Campina Grande/PB')).not.toBeOnTheScreen();
    });

    it('fecha ao tocar em área vazia do mapa', async () => {
      await renderizarMapaCarregado();
      await fireEvent.press(screen.getByLabelText('Marcador Farmácia Prata'));

      await fireEvent.press(screen.getByLabelText('Área vazia do mapa'));

      expect(screen.queryByText(AVISO_ESTOQUE)).not.toBeOnTheScreen();
    });

    it('fecha pelo botão de fechar', async () => {
      await renderizarMapaCarregado();
      await fireEvent.press(screen.getByLabelText('Marcador Farmácia Prata'));

      await fireEvent.press(screen.getByLabelText('Fechar detalhes da farmácia'));

      expect(screen.queryByText(AVISO_ESTOQUE)).not.toBeOnTheScreen();
    });

    it('abre ao tocar em "Ver no mapa" na lista', async () => {
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Ver Farmácia Centro no mapa'));

      expect(screen.getByText('Centro — Campina Grande/PB')).toBeOnTheScreen();
    });
  });

  describe('traçar rota', () => {
    it('abre a rota no Google Maps com as coordenadas da farmácia', async () => {
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Traçar rota até Farmácia Prata no Google Maps'));

      expect(abrirRotaMock).toHaveBeenCalledWith(prata.latitude, prata.longitude);
    });

    it('avisa o usuário quando não é possível abrir o Google Maps', async () => {
      abrirRotaMock.mockRejectedValue(new Error('Nenhum app disponível'));
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Traçar rota até Farmácia Prata no Google Maps'));

      expect(
        await screen.findByText(
          'Não foi possível abrir o Google Maps. Verifique se há um navegador ou o app instalado.'
        )
      ).toBeOnTheScreen();
    });
  });

  describe('localização do usuário', () => {
    it('só pede a localização quando o usuário toca no botão', async () => {
      obterLocalizacaoMock.mockResolvedValue({ latitude: -7.2, longitude: -35.9 });
      await renderizarMapaCarregado();

      expect(obterLocalizacaoMock).not.toHaveBeenCalled();

      await fireEvent.press(screen.getByLabelText('Usar minha localização'));

      expect(await screen.findByText('Você está em -7.2,-35.9')).toBeOnTheScreen();
      expect(obterLocalizacaoMock).toHaveBeenCalledTimes(1);
    });

    it('mostra o motivo quando a localização não pode ser obtida', async () => {
      obterLocalizacaoMock.mockRejectedValue(
        new Error('Permissão de localização negada. Você pode continuar usando o mapa normalmente.')
      );
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Usar minha localização'));

      expect(
        await screen.findByText('Permissão de localização negada. Você pode continuar usando o mapa normalmente.')
      ).toBeOnTheScreen();
      expect(screen.getByText('2 farmácias encontradas')).toBeOnTheScreen();
    });
  });

  describe('trocar município', () => {
    it('volta para a tela anterior quando há histórico', async () => {
      mockRouter.canGoBack.mockReturnValue(true);
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Trocar município'));

      expect(mockRouter.back).toHaveBeenCalled();
    });

    it('abre os municípios da UF quando não há histórico (acesso direto pela URL)', async () => {
      mockRouter.canGoBack.mockReturnValue(false);
      await renderizarMapaCarregado();

      await fireEvent.press(screen.getByLabelText('Trocar município'));

      await waitFor(() =>
        expect(mockRouter.replace).toHaveBeenCalledWith({ pathname: '/municipios', params: { uf: 'PB' } })
      );
    });
  });
});
