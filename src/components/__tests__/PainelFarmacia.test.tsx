import { fireEvent, screen } from '@testing-library/react-native';

import { criarFarmacia, renderizar } from '@/testes/renderizar';

import { PainelFarmacia } from '../PainelFarmacia';

describe('PainelFarmacia', () => {
  const farmacia = criarFarmacia();

  async function renderizarPainel(props: { onTracarRota?: jest.Mock; onFechar?: jest.Mock } = {}) {
    await renderizar(
      <PainelFarmacia
        farmacia={farmacia}
        nomeMunicipio="Campina Grande"
        uf="PB"
        variante="inferior"
        onTracarRota={props.onTracarRota ?? jest.fn()}
        onFechar={props.onFechar ?? jest.fn()}
      />
    );
  }

  it('exibe nome, endereço, bairro e município/UF da farmácia', async () => {
    await renderizarPainel();

    expect(screen.getByRole('header', { name: 'Farmácia Central Popular' })).toBeOnTheScreen();
    expect(screen.getByText('Rua Venâncio Neiva, 120')).toBeOnTheScreen();
    expect(screen.getByText('Centro — Campina Grande/PB')).toBeOnTheScreen();
  });

  it('avisa que a localização não confirma estoque de medicamentos', async () => {
    await renderizarPainel();

    expect(screen.getByText('A localização não confirma estoque de medicamentos.')).toBeOnTheScreen();
  });

  it('"Traçar rota" entrega a farmácia exibida', async () => {
    const onTracarRota = jest.fn();
    await renderizarPainel({ onTracarRota });

    await fireEvent.press(screen.getByLabelText('Traçar rota até Farmácia Central Popular no Google Maps'));

    expect(onTracarRota).toHaveBeenCalledWith(farmacia);
  });

  it('o botão de fechar chama onFechar', async () => {
    const onFechar = jest.fn();
    await renderizarPainel({ onFechar });

    await fireEvent.press(screen.getByLabelText('Fechar detalhes da farmácia'));

    expect(onFechar).toHaveBeenCalledTimes(1);
  });
});
