import * as Location from 'expo-location';

export type Coordenada = {
  latitude: number;
  longitude: number;
};

/**
 * Pede a permissão de localização (somente em primeiro plano) e devolve a posição atual.
 * A posição não é armazenada: fica apenas em memória enquanto a tela do mapa está aberta.
 */
export async function obterLocalizacaoAtual(): Promise<Coordenada> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) {
    throw new Error('Permissão de localização negada. Você pode continuar usando o mapa normalmente.');
  }

  try {
    const posicao = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
  } catch {
    throw new Error('Não foi possível obter sua localização. Verifique se o GPS está ativado.');
  }
}
