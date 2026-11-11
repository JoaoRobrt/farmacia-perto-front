import type { EdgePadding, Region } from 'react-native-maps';

import { Farmacia } from '@/types';

export interface MapViewContainerProps {
  initialRegion: Region;
  farmacias: Farmacia[];
  farmaciaSelecionadaId?: string;
  mapPadding?: EdgePadding;
  onMapReady?: () => void;
  onSelectFarmacia: (farmacia: Farmacia) => void;
  onPressMapa?: () => void;
}
