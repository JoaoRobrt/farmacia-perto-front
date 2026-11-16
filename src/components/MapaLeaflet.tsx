import 'leaflet/dist/leaflet.css';

import L from 'leaflet';
import { useEffect, useMemo } from 'react';
import { CircleMarker, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { useTheme } from 'react-native-paper';

import { Farmacia } from '@/types';

import { DURACAO_CAMERA_MS, MapViewContainerProps, REGIAO_PADRAO } from './MapViewContainer.types';

// Usado somente na web (importado por MapViewContainer.web.tsx).

const ZOOM_INICIAL = 13;
const ZOOM_PONTO = 16;
const PADDING_ENQUADRAMENTO: L.PointTuple = [40, 40];
const COR_LOCALIZACAO_USUARIO = '#1A73E8';

function criarIconePin(cor: string): L.DivIcon {
  return L.divIcon({
    className: 'pin-farmacia',
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    html: `<svg width="32" height="42" viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 26 16 26s16-14 16-26C32 7.2 24.8 0 16 0z" fill="${cor}"/>
      <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
    </svg>`,
  });
}

function ControleCamera({ farmacias, farmaciaSelecionada, localizacaoUsuario }: MapViewContainerProps) {
  const mapa = useMap();
  const duracaoSegundos = DURACAO_CAMERA_MS / 1000;

  // O container muda de tamanho quando o painel lateral abre ou fecha.
  useEffect(() => {
    const observador = new ResizeObserver(() => mapa.invalidateSize());
    observador.observe(mapa.getContainer());
    return () => observador.disconnect();
  }, [mapa]);

  useEffect(() => {
    if (farmacias.length === 0) return;
    if (farmacias.length === 1) {
      mapa.setView([farmacias[0].latitude, farmacias[0].longitude], ZOOM_PONTO);
      return;
    }
    mapa.fitBounds(
      farmacias.map((f) => [f.latitude, f.longitude] as L.LatLngTuple),
      { padding: PADDING_ENQUADRAMENTO }
    );
  }, [farmacias, mapa]);

  useEffect(() => {
    if (!farmaciaSelecionada) return;
    mapa.panTo([farmaciaSelecionada.latitude, farmaciaSelecionada.longitude], { duration: duracaoSegundos });
  }, [farmaciaSelecionada, mapa, duracaoSegundos]);

  useEffect(() => {
    if (!localizacaoUsuario) return;
    mapa.flyTo([localizacaoUsuario.latitude, localizacaoUsuario.longitude], ZOOM_PONTO - 1, {
      duration: duracaoSegundos,
    });
  }, [localizacaoUsuario, mapa, duracaoSegundos]);

  return null;
}

function EventosMapa({ onPressMapa }: { onPressMapa?: () => void }) {
  useMapEvents({ click: () => onPressMapa?.() });
  return null;
}

export function MapaLeaflet(props: MapViewContainerProps) {
  const { farmacias, farmaciaSelecionada, localizacaoUsuario, onSelectFarmacia, onPressMapa } = props;
  const theme = useTheme();

  const iconePadrao = useMemo(() => criarIconePin(theme.colors.primary), [theme.colors.primary]);
  const iconeSelecionado = useMemo(() => criarIconePin(theme.colors.secondary), [theme.colors.secondary]);

  const handleSelecionar = (farmacia: Farmacia) => () => onSelectFarmacia(farmacia);

  return (
    <MapContainer
      center={[REGIAO_PADRAO.latitude, REGIAO_PADRAO.longitude]}
      zoom={ZOOM_INICIAL}
      // Evita que a rolagem da página fique presa no mapa; o zoom continua pelos botões e gestos.
      scrollWheelZoom={false}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {farmacias.map((farmacia) => (
        <Marker
          key={farmacia.id}
          position={[farmacia.latitude, farmacia.longitude]}
          icon={farmacia.id === farmaciaSelecionada?.id ? iconeSelecionado : iconePadrao}
          title={farmacia.nome}
          alt={`Farmácia ${farmacia.nome}, ${farmacia.bairro}`}
          eventHandlers={{ click: handleSelecionar(farmacia) }}
        />
      ))}
      {localizacaoUsuario && (
        <CircleMarker
          center={[localizacaoUsuario.latitude, localizacaoUsuario.longitude]}
          radius={8}
          pathOptions={{ color: '#FFFFFF', weight: 3, fillColor: COR_LOCALIZACAO_USUARIO, fillOpacity: 1 }}
        />
      )}
      <ControleCamera {...props} />
      <EventosMapa onPressMapa={onPressMapa} />
    </MapContainer>
  );
}
