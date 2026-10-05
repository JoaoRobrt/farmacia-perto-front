import { farmacias, estados, municipios } from '../data';
import { Estado, Farmacia, Municipio } from '../types';

const SIMULATED_DELAY_MS = 300;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retorna a lista de todos os estados brasileiros.
 * Atualmente consome dados mockados com delay simulado.
 */
export async function listarEstados(): Promise<Estado[]> {
  await delay(SIMULATED_DELAY_MS);
  return estados;
}

/**
 * Retorna a lista de municípios para o estado informado pela sigla (ex: "PB").
 * Atualmente consome dados mockados com delay simulado.
 */
export async function listarMunicipios(uf: string): Promise<Municipio[]> {
  await delay(SIMULATED_DELAY_MS);
  return municipios.filter((m) => m.uf.toUpperCase() === uf.toUpperCase());
}

/**
 * Retorna a lista de farmácias para o município informado pelo id (ex: "pb-campina-grande").
 * Atualmente consome dados mockados com delay simulado.
 */
export async function listarFarmacias(municipioId: string): Promise<Farmacia[]> {
  await delay(SIMULATED_DELAY_MS);
  return farmacias.filter((f) => f.municipioId === municipioId);
}

/* 
================================================================================
  IMPLEMENTAÇÃO ALTERNATIVA PARA INTEGRAÇÃO COM A API HTTP REAL (FUTURA)
================================================================================
  Quando o back-end estiver pronto, basta substituir as funções acima por:

  import { apiGet } from './apiClient';

  export async function listarEstados(): Promise<Estado[]> {
    return apiGet<Estado[]>('/estados');
  }

  export async function listarMunicipios(uf: string): Promise<Municipio[]> {
    return apiGet<Municipio[]>(`/estados/${encodeURIComponent(uf)}/municipios`);
  }

  export async function listarFarmacias(municipioId: string): Promise<Farmacia[]> {
    return apiGet<Farmacia[]>(`/municipios/${encodeURIComponent(municipioId)}/farmacias`);
  }
================================================================================
*/
