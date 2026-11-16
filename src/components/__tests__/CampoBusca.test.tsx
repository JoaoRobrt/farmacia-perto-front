import { fireEvent, screen } from '@testing-library/react-native';

import { renderizar } from '@/testes/renderizar';

import { CampoBusca } from '../CampoBusca';

describe('CampoBusca', () => {
  it('exibe o placeholder e o valor atual', async () => {
    await renderizar(<CampoBusca placeholder="Buscar estado..." value="Para" onChangeText={jest.fn()} />);

    expect(screen.getByPlaceholderText('Buscar estado...')).toHaveDisplayValue('Para');
  });

  it('repassa o texto digitado para onChangeText', async () => {
    const onChangeText = jest.fn();
    await renderizar(<CampoBusca placeholder="Buscar estado..." value="" onChangeText={onChangeText} />);

    await fireEvent.changeText(screen.getByPlaceholderText('Buscar estado...'), 'Paraíba');

    expect(onChangeText).toHaveBeenCalledWith('Paraíba');
  });

  it('é identificável por leitores de tela pelo rótulo informado', async () => {
    await renderizar(
      <CampoBusca
        placeholder="Buscar município..."
        value=""
        onChangeText={jest.fn()}
        accessibilityLabel="Campo de busca por município em PB"
      />
    );

    expect(screen.getByLabelText('Campo de busca por município em PB')).toBeOnTheScreen();
  });
});
