import { apiGet } from '../apiClient';

const URL_ORIGINAL = process.env.EXPO_PUBLIC_API_URL;

function respostaHttp(status: number, corpo: unknown, statusText = '') {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: async () => corpo,
    text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
  } as Response;
}

describe('apiGet', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.local/';
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    process.env.EXPO_PUBLIC_API_URL = URL_ORIGINAL;
    jest.useRealTimers();
  });

  it('falha com mensagem clara quando a URL da API não está configurada', async () => {
    process.env.EXPO_PUBLIC_API_URL = '';

    await expect(apiGet('/estados')).rejects.toThrow('EXPO_PUBLIC_API_URL não configurada');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('faz GET na URL base sem barras duplicadas e devolve o JSON', async () => {
    const estados = [{ sigla: 'PB', nome: 'Paraíba' }];
    fetchMock.mockResolvedValue(respostaHttp(200, estados));

    const resultado = await apiGet('/estados');

    expect(resultado).toEqual(estados);
    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.local/estados',
      expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } })
    );
  });

  it('transforma status HTTP fora de 2xx em erro com o status e o corpo', async () => {
    fetchMock.mockResolvedValue(respostaHttp(404, 'Município não encontrado', 'Not Found'));

    await expect(apiGet('/municipios/x/farmacias')).rejects.toThrow('Erro na API (404): Município não encontrado');
  });

  it('usa o statusText quando a resposta de erro vem sem corpo', async () => {
    fetchMock.mockResolvedValue(respostaHttp(500, '', 'Internal Server Error'));

    await expect(apiGet('/estados')).rejects.toThrow('Erro na API (500): Internal Server Error');
  });

  it('aborta a requisição e informa timeout quando o tempo limite é excedido', async () => {
    jest.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, { signal }: RequestInit) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener('abort', () => {
            const erro = new Error('aborted');
            erro.name = 'AbortError';
            reject(erro);
          });
        })
    );

    const requisicao = apiGet('/estados', 1000);
    jest.advanceTimersByTime(1000);

    await expect(requisicao).rejects.toThrow('Tempo limite da requisição excedido');
  });

  it('propaga erros de rede que não são timeout', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'));

    await expect(apiGet('/estados')).rejects.toThrow('Network request failed');
  });
});
