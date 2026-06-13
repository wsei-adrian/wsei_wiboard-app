import {
  fromBackendDashboardConfig,
  toBackendDashboardConfig,
} from '../backend/dashboard-config-mapper';
import type { Client } from '../backend/generated/client';
import { ApiException } from '../backend/generated/client';
import type { DashboardConfiguration } from '../dashboard/dashboard.types';
import type { DashboardConfigurationProvider } from './dashboard-configuration-provider';

export class BackendDashboardConfigurationProvider implements DashboardConfigurationProvider {
  readonly id = 'backend';
  readonly label = 'Backend';
  private readonly client: Client;

  constructor(client: Client) {
    this.client = client;
  }

  async loadConfiguration(): Promise<DashboardConfiguration | null> {
    try {
      const dto = await this.client.getDashboardConfig();
      return fromBackendDashboardConfig(dto);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async saveConfiguration(configuration: DashboardConfiguration): Promise<void> {
    await this.client.putDashboardConfig(toBackendDashboardConfig(configuration));
  }

  private isNotFoundError(error: unknown): boolean {
    if (ApiException.isApiException(error)) {
      return error.status === 404;
    }

    return (
      typeof error === 'object' &&
      error !== null &&
      'status' in error &&
      error.status === 404
    );
  }
}
