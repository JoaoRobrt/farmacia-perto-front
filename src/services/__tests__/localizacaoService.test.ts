import * as Location from 'expo-location';

import { obterLocalizacaoAtual } from '../localizacaoService';

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
  PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' },
  Accuracy: { Balanced: 3 },
}));

const pedirPermissao = Location.requestForegroundPermissionsAsync as jest.Mock;
const obterPosicao = Location.getCurrentPositionAsync as jest.Mock;

describe('obterLocalizacaoAtual', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('devolve apenas latitude e longitude quando a permissão é concedida', async () => {
    pedirPermissao.mockResolvedValue({ status: 'granted' });
    obterPosicao.mockResolvedValue({ coords: { latitude: -7.23, longitude: -35.88, altitude: 500, accuracy: 10 } });

    await expect(obterLocalizacaoAtual()).resolves.toEqual({ latitude: -7.23, longitude: -35.88 });
  });

  it('informa que o mapa continua utilizável quando a permissão é negada, sem consultar o GPS', async () => {
    pedirPermissao.mockResolvedValue({ status: 'denied' });

    await expect(obterLocalizacaoAtual()).rejects.toThrow(
      'Permissão de localização negada. Você pode continuar usando o mapa normalmente.'
    );
    expect(obterPosicao).not.toHaveBeenCalled();
  });

  it('orienta a ativar o GPS quando a posição não pode ser obtida', async () => {
    pedirPermissao.mockResolvedValue({ status: 'granted' });
    obterPosicao.mockRejectedValue(new Error('Location services are disabled'));

    await expect(obterLocalizacaoAtual()).rejects.toThrow(
      'Não foi possível obter sua localização. Verifique se o GPS está ativado.'
    );
  });
});
