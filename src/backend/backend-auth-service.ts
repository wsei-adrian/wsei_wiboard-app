import type { Client } from './generated/client';
import { LoginRequest } from './generated/client';

export class BackendAuthService {
  private accessToken: string | null = null;
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    const login = window.prompt('Backend login');
    const password = window.prompt('Backend password');

    if (!login || !password) {
      throw new Error('Backend login and password are required.');
    }

    const response = await this.client.login(new LoginRequest({ login, password }));
    this.accessToken = response.accessToken;

    return this.accessToken;
  }
}
