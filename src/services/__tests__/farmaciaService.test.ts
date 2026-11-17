import { estados, farmacias, municipios } from '../../data';
import { listarEstados, listarFarmacias, listarMunicipios } from '../farmaciaService';

describe('listarEstados', () => {
  it('retorna as 27 unidades federativas sem siglas repetidas', async () => {
    const resultado = await listarEstados();

    expect(resultado).toHaveLength(27);
    expect(new Set(resultado.map((e) => e.sigla)).size).toBe(27);
    expect(resultado).toContainEqual({ sigla: 'PB', nome: 'Paraíba' });
  });
});

describe('listarMunicipios', () => {
  it('retorna apenas os municípios da UF informada', async () => {
    const resultado = await listarMunicipios('PB');

    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado.every((m) => m.uf === 'PB')).toBe(true);
    expect(resultado.map((m) => m.nome)).toEqual(expect.arrayContaining(['Campina Grande', 'João Pessoa']));
  });

  it('ignora maiúsculas e minúsculas na UF', async () => {
    expect(await listarMunicipios('pb')).toEqual(await listarMunicipios('PB'));
  });

  it('retorna lista vazia para UF sem municípios cadastrados', async () => {
    expect(await listarMunicipios('AC')).toEqual([]);
  });
});

describe('listarFarmacias', () => {
  it('retorna apenas as farmácias do município informado', async () => {
    const resultado = await listarFarmacias('pb-campina-grande');

    expect(resultado).toHaveLength(12);
    expect(resultado.every((f) => f.municipioId === 'pb-campina-grande')).toBe(true);
  });

  it('retorna lista vazia para município sem farmácias', async () => {
    expect(await listarFarmacias('pb-patos')).toEqual([]);
  });
});

describe('consistência dos dados mockados', () => {
  it('toda farmácia pertence a um município cadastrado', () => {
    const idsMunicipios = new Set(municipios.map((m) => m.id));

    expect(farmacias.filter((f) => !idsMunicipios.has(f.municipioId))).toEqual([]);
  });

  it('todo município pertence a uma UF cadastrada', () => {
    const siglas = new Set(estados.map((e) => e.sigla));

    expect(municipios.filter((m) => !siglas.has(m.uf))).toEqual([]);
  });

  it('não há ids repetidos de farmácias nem de municípios', () => {
    expect(new Set(farmacias.map((f) => f.id)).size).toBe(farmacias.length);
    expect(new Set(municipios.map((m) => m.id)).size).toBe(municipios.length);
  });
});
