import { fireEvent, screen } from '@testing-library/react-native';

import { criarFarmacia, renderizar } from '@/testes/renderizar';

import { CartaoFarmacia } from '../CartaoFarmacia';

describe('CartaoFarmacia', () => {
  const farmacia = criarFarmacia();

  it('exibe nome, endereço e bairro da farmácia', async () => {
    await renderizar(
      <CartaoFarmacia farmacia={farmacia} selecionada={false} onVerNoMapa={jest.fn()} onTracarRota={jest.fn()} />
    );

    expect(screen.getByText('Farmácia Central Popular')).toBeOnTheScreen();
    expect(screen.getByText('Rua Venâncio Neiva, 120')).toBeOnTheScreen();
    expect(screen.getByText('Centro')).toBeOnTheScreen();
  });

  it('"Ver no mapa" entrega a farmácia do cartão', async () => {
    const onVerNoMapa = jest.fn();
    await renderizar(
      <CartaoFarmacia farmacia={farmacia} selecionada={false} onVerNoMapa={onVerNoMapa} onTracarRota={jest.fn()} />
    );

    await fireEvent.press(screen.getByLabelText('Ver Farmácia Central Popular no mapa'));

    expect(onVerNoMapa).toHaveBeenCalledWith(farmacia);
  });

  it('"Traçar rota" entrega a farmácia do cartão', async () => {
    const onTracarRota = jest.fn();
    await renderizar(
      <CartaoFarmacia farmacia={farmacia} selecionada={false} onVerNoMapa={jest.fn()} onTracarRota={onTracarRota} />
    );

    await fireEvent.press(screen.getByLabelText('Traçar rota até Farmácia Central Popular no Google Maps'));

    expect(onTracarRota).toHaveBeenCalledWith(farmacia);
  });
});
