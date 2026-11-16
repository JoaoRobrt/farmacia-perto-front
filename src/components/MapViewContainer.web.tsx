import { lazy, Suspense, useSyncExternalStore } from 'react';

import { LoadingView } from './LoadingView';
import { MapViewContainerProps } from './MapViewContainer.types';

// O Leaflet acessa `window` ao ser importado; por isso é carregado sob demanda e só
// no navegador, evitando erro na renderização estática (web.output = "static").
const MapaLeaflet = lazy(() => import('./MapaLeaflet').then((modulo) => ({ default: modulo.MapaLeaflet })));

const semInscricao = () => () => {};

function useNoNavegador(): boolean {
  return useSyncExternalStore(
    semInscricao,
    () => true,
    () => false
  );
}

export function MapViewContainer(props: MapViewContainerProps) {
  const noNavegador = useNoNavegador();
  const carregando = <LoadingView message="Carregando mapa..." />;

  if (!noNavegador) {
    return carregando;
  }

  return (
    <Suspense fallback={carregando}>
      <MapaLeaflet {...props} />
    </Suspense>
  );
}
