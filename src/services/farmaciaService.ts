import { Estado, Farmacia, Municipio } from '../types';
import { apiGet } from './apiClient';

/**
 * Retorna a lista de estados disponíveis na API.
 */
export async function listarEstados(): Promise<Estado[]> {
  return apiGet<Estado>('/estados');
}

/**
 * Retorna a lista de municípios para o estado informado pela sigla (ex: "PB").
 */
export async function listarMunicipios(uf: string): Promise<Municipio[]> {
  return apiGet<Municipio>(`/estados/${encodeURIComponent(uf)}/municipios`);
}

/**
 * Retorna a lista de farmácias para o município informado pelo id (ex: "pb-campina-grande").
 */
export async function listarFarmacias(municipioId: string): Promise<Farmacia[]> {
  return apiGet<Farmacia>(`/municipios/${encodeURIComponent(municipioId)}/farmacias`);
}
