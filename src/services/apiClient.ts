const DEFAULT_TIMEOUT_MS = 10000;

export async function apiGet<T>(endpoint: string, timeoutMs: number = DEFAULT_TIMEOUT_MS): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('Variável de ambiente EXPO_PUBLIC_API_URL não configurada.');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(`Erro na API (${response.status}): ${errorText || response.statusText || 'Falha na requisição'}`);
    }

    return (await response.json()) as T;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Tempo limite da requisição excedido (timeout).');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
