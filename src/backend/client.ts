import { Client } from './generated/client';

const BACKEND_BASE_URL = 'https://wiboard-backend.runasp.net/';

export interface AccessTokenProvider {
  getAccessToken(): Promise<string>;
}

export function createBackendClient(accessTokenProvider?: AccessTokenProvider): Client {
  if (!accessTokenProvider) {
    return new Client(BACKEND_BASE_URL);
  }

  return new Client(BACKEND_BASE_URL, {
    fetch: async (url, init) => {
      const headers = new Headers(init?.headers);
      const token = await accessTokenProvider.getAccessToken();

      headers.set('Authorization', `Bearer ${token}`);

      return window.fetch(url, {
        ...init,
        headers,
      });
    },
  });
}
