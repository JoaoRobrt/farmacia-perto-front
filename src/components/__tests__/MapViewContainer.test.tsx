import { fireEvent, screen } from '@testing-library/react-native';

import { criarFarmacia, renderizar } from '@/testes/renderizar';

import { MapViewContainer } from '../MapViewContainer';
import { DELTA_ZOOM_PONTO } from '../MapViewContainer.types';

// O mapa nativo não roda no Jest: o mock expõe os marcadores como botões e
// registra as chamadas de câmera feitas pela referência do MapView.
jest.mock('react-native-maps', () => {
  const React = jest.requireActual('react');
  const { Pressable } = jest.requireActual('react-native');
  const camera = { fitToCoordinates: jest.fn(), animateToRegion: jest.fn(), animateCamera: jest.fn() };

  const MapView = React.forwardRef(function MapView(props: any, ref: any) {
    const { onMapReady } = props;
    React.useImperativeHandle(ref, () => camera);
    React.useEffect(() => {
      onMapReady?.();
    }, [onMapReady]);
    return React.createElement(Pressable, { testID: 'mapa', onPress: props.onPress }, props.children);
  });
  const Marker = (props: any) =>
    React.createElement(Pressable, {
      accessibilityLabel: props.accessibilityLabel,
      accessibilityRole: props.accessibilityRole,
      onPress: props.onPress,
    });

  return { __esModule: true, default: MapView, Marker, PROVIDER_GOOGLE: 'google', camera };
});

const camera = jest.requireMock('react-native-maps').camera as Record<string, jest.Mock>;

const centro = criarFarmacia({ id: 'cg-01', nome: 'Farmácia Centro', bairro: 'Centro' });
const prata = criarFarmacia({
  id: 'cg-02',
  nome: 'Farmácia Prata',
  bairro: 'Prata',
  latitude: -7.226,
  longitude: -35.89,
});

async function renderizarMapa(props: Partial<Parameters<typeof MapViewContainer>[0]> = {}) {
  const onSelectFarmacia = jest.fn();
  const onPressMapa = jest.fn();
  await renderizar(
    <MapViewContainer
      farmacias={[centro, prata]}
      farmaciaSelecionada={null}
      localizacaoUsuario={null}
      onSelectFarmacia={onSelectFarmacia}
      onPressMapa={onPressMapa}
      {...props}
    />
  );
  return { onSelectFarmacia, onPressMapa };
}

describe('MapViewContainer (Android)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('exibe um marcador acessível por farmácia', async () => {
    await renderizarMapa();

    expect(screen.getByLabelText('Farmácia Farmácia Centro, Centro')).toBeOnTheScreen();
    expect(screen.getByLabelText('Farmácia Farmácia Prata, Prata')).toBeOnTheScreen();
  });

  it('tocar em um marcador seleciona a farmácia correspondente', async () => {
    const { onSelectFarmacia } = await renderizarMapa();

    await fireEvent.press(screen.getByLabelText('Farmácia Farmácia Prata, Prata'));

    expect(onSelectFarmacia).toHaveBeenCalledWith(prata);
  });

  it('enquadra todas as farmácias quando há mais de uma', async () => {
    await renderizarMapa();

    expect(camera.fitToCoordinates).toHaveBeenCalledWith(
      [
        { latitude: centro.latitude, longitude: centro.longitude },
        { latitude: prata.latitude, longitude: prata.longitude },
      ],
      expect.objectContaining({ animated: true })
    );
  });

  it('centraliza com zoom aproximado quando há uma única farmácia', async () => {
    await renderizarMapa({ farmacias: [centro] });

    expect(camera.fitToCoordinates).not.toHaveBeenCalled();
    expect(camera.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({
        latitude: centro.latitude,
        longitude: centro.longitude,
        latitudeDelta: DELTA_ZOOM_PONTO,
      }),
      expect.any(Number)
    );
  });

  it('não move a câmera quando não há farmácias', async () => {
    await renderizarMapa({ farmacias: [] });

    expect(camera.fitToCoordinates).not.toHaveBeenCalled();
    expect(camera.animateToRegion).not.toHaveBeenCalled();
  });

  it('centraliza o mapa na farmácia selecionada', async () => {
    await renderizarMapa({ farmaciaSelecionada: prata });

    expect(camera.animateCamera).toHaveBeenCalledWith(
      { center: { latitude: prata.latitude, longitude: prata.longitude } },
      expect.any(Object)
    );
  });

  it('move a câmera para a localização do usuário quando ela é informada', async () => {
    await renderizarMapa({ farmacias: [], localizacaoUsuario: { latitude: -7.2, longitude: -35.9 } });

    expect(camera.animateToRegion).toHaveBeenCalledWith(
      expect.objectContaining({ latitude: -7.2, longitude: -35.9 }),
      expect.any(Number)
    );
  });

  it('tocar em área vazia do mapa chama onPressMapa', async () => {
    const { onPressMapa } = await renderizarMapa();

    await fireEvent.press(screen.getByTestId('mapa'), { nativeEvent: { action: 'press' } });

    expect(onPressMapa).toHaveBeenCalledTimes(1);
  });

  it('ignora o toque no mapa disparado junto com o toque em marcador (iOS)', async () => {
    const { onPressMapa } = await renderizarMapa();

    await fireEvent.press(screen.getByTestId('mapa'), { nativeEvent: { action: 'marker-press' } });

    expect(onPressMapa).not.toHaveBeenCalled();
  });
});
