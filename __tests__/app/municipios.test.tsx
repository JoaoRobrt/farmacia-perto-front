import { fireEvent, screen } from '@testing-library/react-native';

import SelectingMunicipalityScreen from '@/../app/municipios';
import { listarMunicipios } from '@/services';
import { renderizar } from '@/testes/renderizar';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn() };
let mockParams: { uf?: string } = {};

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    useRouter: () => mockRouter,
    useLocalSearchParams: () => mockParams,
    Stack: { Screen: ({ options }: any) => React.createElement(Text, null, options?.title) },
  };
});

jest.mock('@/services', () => ({ listarMunicipios: jest.fn() }));

const listarMunicipiosMock = listarMunicipios as jest.Mock;

const MUNICIPIOS_PB = [
  { id: 'pb-campina-grande', nome: 'Campina Grande', uf: 'PB' },
  { id: 'pb-joao-pessoa', nome: 'João Pessoa', uf: 'PB' },
  { id: 'pb-patos', nome: 'Patos', uf: 'PB' },
];

describe('Tela de seleção de município', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = { uf: 'pb' };
    listarMunicipiosMock.mockResolvedValue(MUNICIPIOS_PB);
  });

  it('mostra o carregamento enquanto a busca não termina', async () => {
    listarMunicipiosMock.mockReturnValue(new Promise(() => {}));
    await renderizar(<SelectingMunicipalityScreen />);

    expect(screen.getByText('Carregando municípios de PB...')).toBeOnTheScreen();
  });

  it('busca os municípios da UF da rota, normalizada para maiúsculas', async () => {
    await renderizar(<SelectingMunicipalityScreen />);

    expect(screen.getByText('Municípios — PB')).toBeOnTheScreen();
    expect(await screen.findByText('Campina Grande')).toBeOnTheScreen();
    expect(screen.getByText('Patos')).toBeOnTheScreen();
    expect(listarMunicipiosMock).toHaveBeenCalledWith('PB');
  });

  it('filtra pelo nome ignorando acentos e maiúsculas', async () => {
    await renderizar(<SelectingMunicipalityScreen />);
    await screen.findByText('Campina Grande');

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar município por nome...'), 'joao');

    expect(screen.getByText('João Pessoa')).toBeOnTheScreen();
    expect(screen.queryByText('Campina Grande')).not.toBeOnTheScreen();
  });

  it('diferencia busca sem resultado de estado sem municípios', async () => {
    await renderizar(<SelectingMunicipalityScreen />);
    await screen.findByText('Campina Grande');

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar município por nome...'), 'Recife');

    expect(screen.getByText('Nenhum município encontrado')).toBeOnTheScreen();
    expect(
      screen.getByText('Não encontramos nenhum município em PB correspondente a "Recife".')
    ).toBeOnTheScreen();
  });

  it('informa quando o estado não tem municípios cadastrados', async () => {
    listarMunicipiosMock.mockResolvedValue([]);
    await renderizar(<SelectingMunicipalityScreen />);

    expect(await screen.findByText('Nenhum município cadastrado para o estado PB.')).toBeOnTheScreen();
  });

  it('navega para o mapa com id, nome e UF do município tocado', async () => {
    await renderizar(<SelectingMunicipalityScreen />);

    await fireEvent.press(await screen.findByLabelText('Selecionar município Campina Grande'));

    expect(mockRouter.push).toHaveBeenCalledWith({
      pathname: '/mapa',
      params: { municipioId: 'pb-campina-grande', nome: 'Campina Grande', uf: 'PB' },
    });
  });

  it('mostra o erro e recarrega ao tocar em "Tentar novamente"', async () => {
    listarMunicipiosMock.mockRejectedValueOnce(new Error('Falha ao buscar municípios.'));
    await renderizar(<SelectingMunicipalityScreen />);

    expect(await screen.findByText('Falha ao buscar municípios.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(await screen.findByText('Campina Grande')).toBeOnTheScreen();
  });

  it('sem UF na rota, não busca nada e oferece voltar à escolha de estado', async () => {
    mockParams = {};
    await renderizar(<SelectingMunicipalityScreen />);

    expect(screen.getByText('Nenhum estado foi informado. Volte e selecione um estado.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Escolher estado'));

    expect(mockRouter.replace).toHaveBeenCalledWith('/');
    expect(listarMunicipiosMock).not.toHaveBeenCalled();
  });
});
