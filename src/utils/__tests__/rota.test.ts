import { Linking } from 'react-native';

import { abrirRotaNoGoogleMaps, urlRotaGoogleMaps } from '../rota';

describe('urlRotaGoogleMaps', () => {
  it('monta a URL universal de rotas do Google Maps com a farmácia como destino', () => {
    expect(urlRotaGoogleMaps(-7.2215, -35.883)).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=-7.2215,-35.883'
    );
  });
});

describe('abrirRotaNoGoogleMaps', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('abre a URL de rota pelo Linking', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    await abrirRotaNoGoogleMaps(-7.2215, -35.883);

    expect(openURL).toHaveBeenCalledWith('https://www.google.com/maps/dir/?api=1&destination=-7.2215,-35.883');
  });

  it('propaga a falha quando o sistema não consegue abrir a URL', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('Nenhum app disponível'));

    await expect(abrirRotaNoGoogleMaps(-7.2215, -35.883)).rejects.toThrow('Nenhum app disponível');
  });
});
