import { apiGet } from '../apiClient';

const URL_ORIGINAL = process.env.EXPO_PUBLIC_API_URL;

const MSG_AUSENTE = 'Variável de ambiente EXPO_PUBLIC_API_URL não configurada.';
const MSG_INVALIDA =
  'Variável de ambiente EXPO_PUBLIC_API_URL inválida. Use um endereço completo, começando com http:// ou https://.';
const MSG_TEMPO_LIMITE = 'O servidor demorou para responder. Tente novamente.';
const MSG_REDE = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
const MSG_RESPOSTA_INVALIDA = 'Resposta inválida da API. Tente novamente.';

function respostaHttp(status: number, corpo: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (typeof corpo === 'string' ? corpo : JSON.stringify(corpo)),
  } as unknown as Response;
}

describe('apiGet', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    process.env.EXPO_PUBLIC_API_URL = 'http://api.local/';
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock;
  });

  afterEach(() => {
    if (URL_ORIGINAL === undefined) {
      delete process.env.EXPO_PUBLIC_API_URL;
    } else {
      process.env.EXPO_PUBLIC_API_URL = URL_ORIGINAL;
    }
    jest.useRealTimers();
  });

  describe('configuração da URL base', () => {
    it('falha com a mensagem de não configurada quando a variável não existe', async () => {
      delete process.env.EXPO_PUBLIC_API_URL;

      await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_AUSENTE));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([['vazia', ''], ['só com espaços', '   ']])(
      'falha com a mensagem de não configurada quando a variável é %s',
      async (_descricao, valor) => {
        process.env.EXPO_PUBLIC_API_URL = valor;

        await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_AUSENTE));
        expect(fetchMock).not.toHaveBeenCalled();
      }
    );

    it.each([
      ['sem protocolo', 'localhost:3000'],
      ['protocolo não http', 'ftp://api.local'],
      ['só o protocolo', 'http://'],
      ['só a barra', '/'],
      ['com query', 'http://localhost:3000?x=1'],
      ['com fragmento', 'http://localhost:3000#topo'],
      ['com espaço no meio', 'http://api local'],
      ['com uma barra só', 'http:/api.local'],
      ['sem host antes da porta', 'http://:3000'],
      ['com texto qualquer', 'abc'],
    ])('falha com a mensagem de inválida e sem chamar a rede quando a URL é %s', async (_descricao, valor) => {
      process.env.EXPO_PUBLIC_API_URL = valor;

      await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_INVALIDA));
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it.each([
      ['barras finais repetidas e espaços ao redor', '  http://api.local///  ', 'http://api.local/estados'],
      ['porta', 'http://localhost:3000', 'http://localhost:3000/estados'],
      ['https com caminho base', 'https://api.local/v1/', 'https://api.local/v1/estados'],
      ['protocolo em maiúsculas', 'HTTP://api.local', 'HTTP://api.local/estados'],
    ])('monta a URL certa com %s', async (_descricao, valor, esperada) => {
      process.env.EXPO_PUBLIC_API_URL = valor;
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      await apiGet('/estados');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe(esperada);
    });

    it('não duplica a barra quando o endpoint não começa com ela', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, []));

      await apiGet('estados');

      expect(fetchMock.mock.calls[0][0]).toBe('http://api.local/estados');
    });
  });

  describe('resposta de sucesso', () => {
    it('faz GET pedindo JSON e devolve a lista recebida', async () => {
      const estados = [{ sigla: 'PB', nome: 'Paraíba' }];
      fetchMock.mockResolvedValue(respostaHttp(200, estados));

      const resultado = await apiGet('/estados');

      expect(resultado).toEqual(estados);
      expect(fetchMock).toHaveBeenCalledWith(
        'http://api.local/estados',
        expect.objectContaining({ method: 'GET', headers: { Accept: 'application/json' } })
      );
    });

    it('devolve lista vazia quando a API responde []', async () => {
      fetchMock.mockResolvedValue(respostaHttp(200, '[]'));

      expect(await apiGet('/estados')).toEqual([]);
    });

    it.each([
      ['objeto', '{"sigla":"PB"}'],
      ['texto JSON', '"ok"'],
      ['número', '42'],
      ['null', 'null'],
      ['corpo vazio', ''],
      ['texto que não é JSON', '<html>erro</html>'],
      ['lista truncada', '[{"sigla":"PB"'],
    ])('rejeita resposta 200 que não é uma lista JSON: %s', async (_descricao, corpo) => {
      fetchMock.mockResolvedValue(respostaHttp(200, corpo));

      await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_RESPOSTA_INVALIDA));
    });
  });

  describe('resposta de erro da API', () => {
    it.each([
      ['mensagem da API', 404, '{"mensagem":"Estado não encontrado"}', 'Estado não encontrado'],
      ['mensagem com espaços preservada como veio', 400, '{"mensagem":"  UF inválida  "}', '  UF inválida  '],
      ['mensagem de erro 500', 500, '{"mensagem":"Falha interna"}', 'Falha interna'],
    ])('usa a %s', async (_descricao, status, corpo, esperada) => {
      fetchMock.mockResolvedValue(respostaHttp(status, corpo));

      await expect(apiGet('/estados/XX/municipios')).rejects.toThrow(new Error(esperada));
    });

    it.each([
      ['sem corpo', 500, ''],
      ['com texto que não é JSON', 502, '<html>Bad Gateway</html>'],
      ['com mensagem só com espaços', 404, '{"mensagem":"   "}'],
      ['com mensagem vazia', 404, '{"mensagem":""}'],
      ['com mensagem que não é texto', 404, '{"mensagem":123}'],
      ['sem o campo mensagem', 404, '{"erro":"x"}'],
      ['com corpo null', 404, 'null'],
      ['com corpo em lista', 404, '[{"mensagem":"x"}]'],
    ])('usa a mensagem com o status quando o erro vem %s', async (_descricao, status, corpo) => {
      fetchMock.mockResolvedValue(respostaHttp(status, corpo));

      await expect(apiGet('/estados')).rejects.toThrow(new Error(`Erro na API (${status}). Tente novamente.`));
    });

    it('faz uma única chamada ao fetch quando a API responde com erro', async () => {
      fetchMock.mockResolvedValue(respostaHttp(500, ''));

      await expect(apiGet('/estados')).rejects.toThrow();
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('falha de rede', () => {
    it('devolve a mensagem de falha de rede quando o fetch rejeita', async () => {
      fetchMock.mockRejectedValue(new TypeError('Network request failed'));

      await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_REDE));
    });

    it('devolve a mensagem de falha de rede quando a leitura do corpo rejeita', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => Promise.reject(new TypeError('connection reset')),
      });

      await expect(apiGet('/estados')).rejects.toThrow(new Error(MSG_REDE));
    });

    it.each([
      ['200', 200],
      ['500', 500],
    ])('não confunde corpo truncado com falha de rede quando o status é %s', async (_descricao, status) => {
      fetchMock.mockResolvedValue(respostaHttp(status, '[{"sigla":"PB"'));

      const esperada = status === 200 ? MSG_RESPOSTA_INVALIDA : `Erro na API (${status}). Tente novamente.`;
      await expect(apiGet('/estados')).rejects.toThrow(new Error(esperada));
    });
  });

  describe('tempo limite', () => {
    function fetchPendente() {
      fetchMock.mockImplementation(
        (_url: string, { signal }: RequestInit) =>
          new Promise((_resolve, reject) => {
            signal?.addEventListener('abort', () => reject(new Error('aborted')));
          })
      );
    }

    function fetchComCorpoPendente(status: number, aoAbortar: 'rejeitar' | 'truncar') {
      fetchMock.mockImplementation(async (_url: string, { signal }: RequestInit) => ({
        ok: status >= 200 && status < 300,
        status,
        text: () =>
          new Promise<string>((resolve, reject) => {
            signal?.addEventListener('abort', () => {
              if (aoAbortar === 'rejeitar') {
                reject(new Error('aborted'));
              } else {
                resolve('[{"sigla":"PB"');
              }
            });
          }),
      }));
    }

    it('rejeita só quando o tempo limite informado se completa', async () => {
      jest.useFakeTimers();
      fetchPendente();
      let rejeitada = false;

      const requisicao = apiGet('/estados', 1000);
      const assercao = expect(requisicao).rejects.toThrow(new Error(MSG_TEMPO_LIMITE));
      requisicao.catch(() => {
        rejeitada = true;
      });

      await jest.advanceTimersByTimeAsync(999);
      expect(rejeitada).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await assercao;
      expect(rejeitada).toBe(true);
    });

    it('usa 10 segundos como tempo limite padrão', async () => {
      jest.useFakeTimers();
      fetchPendente();
      let rejeitada = false;

      const requisicao = apiGet('/estados');
      const assercao = expect(requisicao).rejects.toThrow(new Error(MSG_TEMPO_LIMITE));
      requisicao.catch(() => {
        rejeitada = true;
      });

      await jest.advanceTimersByTimeAsync(9999);
      expect(rejeitada).toBe(false);

      await jest.advanceTimersByTimeAsync(1);
      await assercao;
    });

    it('cancela a requisição ao estourar o tempo limite', async () => {
      jest.useFakeTimers();
      fetchPendente();

      const requisicao = apiGet('/estados', 1000);
      const assercao = expect(requisicao).rejects.toThrow(new Error(MSG_TEMPO_LIMITE));
      await jest.advanceTimersByTimeAsync(1000);
      await assercao;

      const { signal } = fetchMock.mock.calls[0][1] as RequestInit;
      expect(signal?.aborted).toBe(true);
    });

    it.each([
      ['rejeita ao ser cancelada', 200, 'rejeitar'],
      ['resolve truncada ao ser cancelada', 200, 'truncar'],
      ['rejeita ao ser cancelada, com status 500', 500, 'rejeitar'],
      ['resolve truncada ao ser cancelada, com status 500', 500, 'truncar'],
    ] as const)(
      'informa tempo limite quando a leitura do corpo fica pendente e %s',
      async (_descricao, status, aoAbortar) => {
        jest.useFakeTimers();
        fetchComCorpoPendente(status, aoAbortar);

        const requisicao = apiGet('/estados', 1000);
        const assercao = expect(requisicao).rejects.toThrow(new Error(MSG_TEMPO_LIMITE));
        await jest.advanceTimersByTimeAsync(1000);

        await assercao;
      }
    );

    it('não deixa temporizador pendente depois de uma resposta bem-sucedida', async () => {
      jest.useFakeTimers();
      fetchMock.mockResolvedValue(respostaHttp(200, '[]'));

      await apiGet('/estados', 1000);

      expect(jest.getTimerCount()).toBe(0);
    });

    it('não deixa temporizador pendente depois de um erro', async () => {
      jest.useFakeTimers();
      fetchMock.mockResolvedValue(respostaHttp(500, ''));

      await expect(apiGet('/estados', 1000)).rejects.toThrow();

      expect(jest.getTimerCount()).toBe(0);
    });
  });
});
