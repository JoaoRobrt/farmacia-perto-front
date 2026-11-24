const DEFAULT_TIMEOUT_MS = 10000;

const URL_BASE_VALIDA = /^https?:\/\/[^\s/?#:][^\s/?#]*(?:\/[^\s?#]*)?$/i;

const MENSAGEM_URL_AUSENTE = 'Variável de ambiente EXPO_PUBLIC_API_URL não configurada.';
const MENSAGEM_URL_INVALIDA =
  'Variável de ambiente EXPO_PUBLIC_API_URL inválida. Use um endereço completo, começando com http:// ou https://.';
const MENSAGEM_TEMPO_LIMITE = 'O servidor demorou para responder. Tente novamente.';
const MENSAGEM_FALHA_DE_REDE = 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
const MENSAGEM_RESPOSTA_INVALIDA = 'Resposta inválida da API. Tente novamente.';

function obterUrlBase(): string {
  // Referência literal: o Expo só embute a variável no bundle quando ela é lida assim.
  const valor = (process.env.EXPO_PUBLIC_API_URL ?? '').trim();
  if (!valor) {
    throw new Error(MENSAGEM_URL_AUSENTE);
  }

  const urlBase = valor.replace(/\/+$/, '');
  if (!URL_BASE_VALIDA.test(urlBase)) {
    throw new Error(MENSAGEM_URL_INVALIDA);
  }
  return urlBase;
}

function interpretarJson(texto: string): unknown {
  try {
    return JSON.parse(texto);
  } catch {
    return undefined;
  }
}

function mensagemDaApi(corpo: unknown): string | undefined {
  if (typeof corpo !== 'object' || corpo === null || !('mensagem' in corpo)) {
    return undefined;
  }
  const { mensagem } = corpo;
  return typeof mensagem === 'string' && mensagem.trim() ? mensagem : undefined;
}

async function requisitar(url: string, signal: AbortSignal) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal,
    });
    return { ok: response.ok, status: response.status, texto: await response.text() };
  } catch {
    throw new Error(MENSAGEM_FALHA_DE_REDE);
  }
}

export async function apiGet<T>(endpoint: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T[]> {
  const url = `${obterUrlBase()}/${endpoint.replace(/^\//, '')}`;
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  // O tempo limite não depende do erro do fetch: no Android o cancelamento não gera AbortError
  // e a leitura do corpo cancelada resolve com o texto truncado.
  const tempoLimite = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(MENSAGEM_TEMPO_LIMITE));
      controller.abort();
    }, timeoutMs);
  });

  try {
    const { ok, status, texto } = await Promise.race([requisitar(url, controller.signal), tempoLimite]);
    const corpo = interpretarJson(texto);

    if (!ok) {
      throw new Error(mensagemDaApi(corpo) ?? `Erro na API (${status}). Tente novamente.`);
    }
    if (!Array.isArray(corpo)) {
      throw new Error(MENSAGEM_RESPOSTA_INVALIDA);
    }
    return corpo as T[];
  } finally {
    clearTimeout(timer);
  }
}
