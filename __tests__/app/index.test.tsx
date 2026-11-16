import { fireEvent, screen } from '@testing-library/react-native';

import SelectingStateScreen from '@/../app/index';
import { listarEstados } from '@/services';
import { renderizar } from '@/testes/renderizar';

const mockRouter = { push: jest.fn(), replace: jest.fn(), back: jest.fn(), canGoBack: jest.fn() };

jest.mock('expo-router', () => {
  const React = jest.requireActual('react');
  const { Text } = jest.requireActual('react-native');
  return {
    useRouter: () => mockRouter,
    Stack: { Screen: ({ options }: any) => React.createElement(Text, null, options?.title) },
  };
});

jest.mock('@/services', () => ({ listarEstados: jest.fn() }));

const listarEstadosMock = listarEstados as jest.Mock;

const ESTADOS = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PE', nome: 'Pernambuco' },
];

describe('Tela de seleção de estado', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listarEstadosMock.mockResolvedValue(ESTADOS);
  });

  it('exibe o título do app e a orientação inicial', async () => {
    await renderizar(<SelectingStateScreen />);

    expect(screen.getByText('Farmácia Perto')).toBeOnTheScreen();
    expect(
      screen.getByText('Encontre farmácias do Programa Farmácia Popular. Escolha seu estado para começar.')
    ).toBeOnTheScreen();
  });

  it('mostra o carregamento enquanto a busca não termina', async () => {
    listarEstadosMock.mockReturnValue(new Promise(() => {}));
    await renderizar(<SelectingStateScreen />);

    expect(screen.getByText('Carregando lista de estados...')).toBeOnTheScreen();
    expect(screen.queryByText('Acre')).not.toBeOnTheScreen();
  });

  it('lista os estados retornados pelo serviço', async () => {
    await renderizar(<SelectingStateScreen />);

    expect(await screen.findByText('Acre')).toBeOnTheScreen();
    expect(screen.getByText('Paraíba')).toBeOnTheScreen();
    expect(screen.getByText('Pernambuco')).toBeOnTheScreen();
    expect(screen.queryByText('Carregando lista de estados...')).not.toBeOnTheScreen();
  });

  it('filtra pelo nome ignorando acentos e maiúsculas', async () => {
    await renderizar(<SelectingStateScreen />);
    await screen.findByText('Acre');

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar estado por nome ou sigla...'), 'PARAIBA');

    expect(screen.getByText('Paraíba')).toBeOnTheScreen();
    expect(screen.queryByText('Acre')).not.toBeOnTheScreen();
    expect(screen.queryByText('Pernambuco')).not.toBeOnTheScreen();
  });

  it('filtra pela sigla', async () => {
    await renderizar(<SelectingStateScreen />);
    await screen.findByText('Acre');

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar estado por nome ou sigla...'), 'pe');

    expect(screen.getByText('Pernambuco')).toBeOnTheScreen();
    expect(screen.queryByText('Paraíba')).not.toBeOnTheScreen();
  });

  it('mostra o estado vazio quando a busca não encontra nada', async () => {
    await renderizar(<SelectingStateScreen />);
    await screen.findByText('Acre');

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar estado por nome ou sigla...'), 'xyz');

    expect(screen.getByText('Nenhum estado encontrado')).toBeOnTheScreen();
    expect(screen.getByText('Não encontramos nenhum estado correspondente a "xyz".')).toBeOnTheScreen();
  });

  it('navega para os municípios do estado tocado', async () => {
    await renderizar(<SelectingStateScreen />);

    await fireEvent.press(await screen.findByLabelText('Selecionar estado Paraíba, PB'));

    expect(mockRouter.push).toHaveBeenCalledWith({ pathname: '/municipios', params: { uf: 'PB' } });
  });

  it('mostra o erro e recarrega ao tocar em "Tentar novamente"', async () => {
    listarEstadosMock.mockRejectedValueOnce(new Error('Sem conexão com a internet.'));
    await renderizar(<SelectingStateScreen />);

    expect(await screen.findByText('Sem conexão com a internet.')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('Tentar novamente'));

    expect(await screen.findByText('Acre')).toBeOnTheScreen();
    expect(listarEstadosMock).toHaveBeenCalledTimes(2);
  });
});
