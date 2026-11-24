import { listarEstados, listarFarmacias, listarMunicipios } from '../farmaciaService';

const URL_ORIGINAL = process.env.EXPO_PUBLIC_API_URL;

const MSG_REDE = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';

function respostaHttp(status: number, corpo: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(corpo),
  } as unknown as Response;
}

describe('farmaciaService', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.local';
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    if (URL_ORIGINAL === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = URL_ORIGINAL;
    }
  });

  describe('listarEstados', () => {
    it('busca /estados e devolve a lista recebida da API', async () => {
      const estados = [
        { sigla: 'AC', nome: 'Acre' },
        { sigla: 'PB', nome: 'Paraíba' },
      ];
      fetchMock.mockResolvedValue(respostaHttp(200, estados));

      expect(await listarEstados()).toEqual(estados);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/estados');
    });

    it('devolve lista vazia quando a API responde []', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      expect(await listarEstados()).toEqual([]);
    });
  });

  describe('listarMunicipios', () => {
    it('busca os municípios da UF informada e devolve a lista recebida', async () => {
      const municipios = [{ id: 'pb-campina-grande', nome: 'Campina Grande', uf: 'PB' }];
      fetchMock.mockResolvedValue(respostaHttp(200, municipios));

      expect(await listarMunicipios('PB')).toEqual(municipios);
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/estados/PB/municipios');
    });

    it('envia a UF como foi informada, sem trocar maiúsculas e minúsculas', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      await listarMunicipios('pb');

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/estados/pb/municipios');
    });

    it('codifica caracteres especiais da UF no caminho', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      await listarMunicipios('P/B?x=1');

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/estados/P%2FB%3Fx%3D1/municipios');
    });
  });

  describe('listarFarmacias', () => {
    it('busca as farmácias do município informado e devolve a lista recebida', async () => {
      const farmacias = [{ id: 'f1', nome: 'Farmácia Central', municipioId: 'pb-campina-grande' }];
      fetchMock.mockResolvedValue(respostaHttp(200, farmacias));

      expect(await listarFarmacias('pb-campina-grande')).toEqual(farmacias);
      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/municipios/pb-campina-grande/farmacias');
    });

    it('codifica caracteres especiais do id do município no caminho', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      await listarFarmacias('a/b#c d');

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/municipios/a%2Fb%23c%20d/farmacias');
    });
  });

  describe('erros da API', () => {
    it.each([
      ['listarEstados', () => listarEstados()],
      ['listarMunicipios', () => listarMunicipios('PB')],
      ['listarFarmacias', () => listarFarmacias('pb-campina-grande')],
    ])('%s repassa a mensagem de erro devolvida pela API', async (_nome, chamar) => {
      fetchMock.mockResolvedValue(respostaHttp(404, { mensagem: 'Recurso não encontrado' }));

      await expect(chamar()).rejects.toThrow(new Error('Recurso não encontrado'));
    });

    it.each([
      ['listarEstados', () => listarEstados()],
      ['listarMunicipios', () => listarMunicipios('PB')],
      ['listarFarmacias', () => listarFarmacias('pb-campina-grande')],
    ])('%s rejeita com a mensagem de falha de rede quando o fetch rejeita', async (_nome, chamar) => {
      fetchMock.mockRejectedValue(new TypeError('Network request failed'));

      await expect(chamar()).rejects.toThrow(new Error(MSG_REDE));
    });

    it.each([
      ['listarEstados', () => listarEstados()],
      ['listarMunicipios', () => listarMunicipios('PB')],
      ['listarFarmacias', () => listarFarmacias('pb-campina-grande')],
    ])('%s rejeita resposta 200 que não é uma lista', async (_nome, chamar) => {
      fetchMock.mockResolvedValue(respostaHttp(200, { sigla: 'PB' }));

      await expect(chamar()).rejects.toThrow(new Error('Resposta inválida da API. Tente novamente.'));
    });
  });
});
