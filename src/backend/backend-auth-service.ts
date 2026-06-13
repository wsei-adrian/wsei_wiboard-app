import type { Client } from './generated/client';
import { LoginRequest } from './generated/client';
import './backend-auth-service.scss';

interface BackendCredentials {
  login: string;
  password: string;
}

interface ValueElement extends HTMLElement {
  value: string;
}

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

    const credentials = await this.readCredentials();

    const response = await this.client.login(new LoginRequest(credentials));
    this.accessToken = response.accessToken;

    return this.accessToken;
  }

  private readCredentials(): Promise<BackendCredentials> {
    return new Promise((resolve, reject) => {
      const dialog = document.createElement('div');
      dialog.className = 'backend-auth';
      dialog.innerHTML = `
        <form class="backend-auth__panel">
          <h2 class="backend-auth__title">Backend login</h2>
          <p class="backend-auth__text">Use your WiBoard backend account.</p>
          <wa-input class="backend-auth__input" name="login" label="Login" autocomplete="username"></wa-input>
          <wa-input class="backend-auth__input" name="password" label="Password" type="password" autocomplete="current-password"></wa-input>
          <p class="backend-auth__error" hidden></p>
          <div class="backend-auth__actions">
            <wa-button class="backend-auth__cancel" type="button" appearance="plain">Cancel</wa-button>
            <wa-button class="backend-auth__submit" type="submit" variant="brand" appearance="filled">Log in</wa-button>
          </div>
        </form>
      `;

      document.body.appendChild(dialog);

      const form = dialog.querySelector<HTMLFormElement>('.backend-auth__panel');
      const loginInput = dialog.querySelector<ValueElement>('[name="login"]');
      const passwordInput = dialog.querySelector<ValueElement>('[name="password"]');
      const errorElement = dialog.querySelector<HTMLElement>('.backend-auth__error');
      const cancelButton = dialog.querySelector<HTMLElement>('.backend-auth__cancel');
      const submitButton = dialog.querySelector<HTMLElement>('.backend-auth__submit');
      let isClosed = false;

      const close = (): void => {
        if (isClosed) {
          return;
        }

        isClosed = true;
        dialog.remove();
      };

      const submit = (): void => {
        if (isClosed) {
          return;
        }

        const login = loginInput?.value.trim() ?? '';
        const password = passwordInput?.value ?? '';

        if (!login || !password) {
          if (errorElement) {
            errorElement.textContent = 'Login and password are required.';
            errorElement.hidden = false;
          }

          return;
        }

        close();
        resolve({ login, password });
      };

      form?.addEventListener('submit', (event) => {
        event.preventDefault();
        submit();
      });

      submitButton?.addEventListener('click', submit);
      cancelButton?.addEventListener('click', () => {
        if (isClosed) {
          return;
        }

        close();
        reject(new Error('Backend login was cancelled.'));
      });

    });
  }
}
