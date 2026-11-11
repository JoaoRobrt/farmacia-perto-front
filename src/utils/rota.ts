import { Linking } from 'react-native';

// URL universal do Google Maps: abre o app quando instalado ou o navegador como alternativa.
export function urlRotaGoogleMaps(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
}

export async function abrirRotaNoGoogleMaps(latitude: number, longitude: number): Promise<void> {
  await Linking.openURL(urlRotaGoogleMaps(latitude, longitude));
}
