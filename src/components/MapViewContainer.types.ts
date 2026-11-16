import type { Coordenada } from '@/services/localizacaoService';
import { Farmacia } from '@/types';

export interface MapViewContainerProps {
  farmacias: Farmacia[];
  farmaciaSelecionada: Farmacia | null;
  localizacaoUsuario: Coordenada | null;
  onSelectFarmacia: (farmacia: Farmacia) => void;
  onPressMapa?: () => void;
}

// Região exibida antes do enquadramento (Campina Grande - PB, município piloto).
export const REGIAO_PADRAO = {
  latitude: -7.2306,
  longitude: -35.8811,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export const DELTA_ZOOM_PONTO = 0.015;
export const DURACAO_CAMERA_MS = 400;
