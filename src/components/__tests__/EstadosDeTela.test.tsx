import { fireEvent, screen } from '@testing-library/react-native';

import { renderizar } from '@/testes/renderizar';

import { EmptyView } from '../EmptyView';
import { ErrorView } from '../ErrorView';
import { LoadingView } from '../LoadingView';

describe('LoadingView', () => {
  it('exibe o indicador de progresso e a mensagem informada', async () => {
    await renderizar(<LoadingView message="Carregando lista de estados..." />);

    expect(screen.getByRole('progressbar')).toBeOnTheScreen();
    expect(screen.getByText('Carregando lista de estados...')).toBeOnTheScreen();
  });

  it('usa "Carregando..." quando nenhuma mensagem é informada', async () => {
    await renderizar(<LoadingView />);

    expect(screen.getByText('Carregando...')).toBeOnTheScreen();
  });
});

describe('EmptyView', () => {
  it('exibe título e mensagem padrão de busca sem resultado', async () => {
    await renderizar(<EmptyView />);

    expect(screen.getByText('Nenhum resultado encontrado')).toBeOnTheScreen();
    expect(screen.getByText('Tente pesquisar por outro termo.')).toBeOnTheScreen();
  });

  it('exibe título e mensagem personalizados', async () => {
    await renderizar(<EmptyView title="Nenhum estado encontrado" message='Nada para "xyz".' />);

    expect(screen.getByText('Nenhum estado encontrado')).toBeOnTheScreen();
    expect(screen.getByText('Nada para "xyz".')).toBeOnTheScreen();
  });

  it('omite a mensagem quando ela é vazia', async () => {
    await renderizar(<EmptyView title="Sem farmácias" message="" />);

    expect(screen.getByText('Sem farmácias')).toBeOnTheScreen();
    expect(screen.queryByText('Tente pesquisar por outro termo.')).not.toBeOnTheScreen();
  });
});

describe('ErrorView', () => {
  it('exibe o alerta, a mensagem do erro e o botão "Tentar novamente"', async () => {
    await renderizar(<ErrorView message="Sem conexão." onRetry={jest.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Ops! Algo deu errado');
    expect(screen.getByText('Sem conexão.')).toBeOnTheScreen();
    expect(screen.getByText('Tentar novamente')).toBeOnTheScreen();
  });

  it('usa uma mensagem padrão quando nenhuma é informada', async () => {
    await renderizar(<ErrorView onRetry={jest.fn()} />);

    expect(
      screen.getByText('Não foi possível carregar os dados. Verifique sua conexão e tente novamente.')
    ).toBeOnTheScreen();
  });

  it('chama onRetry ao tocar no botão, inclusive com rótulo personalizado', async () => {
    const onRetry = jest.fn();
    await renderizar(<ErrorView onRetry={onRetry} retryLabel="Escolher estado" />);

    await fireEvent.press(screen.getByText('Escolher estado'));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
