import type { DashboardConfiguration } from '../dashboard/dashboard.types';
import type { DashboardConfigurationProvider } from './dashboard-configuration-provider';

export class BackendDashboardConfigurationProvider implements DashboardConfigurationProvider {
  readonly id = 'backend';
  readonly label = 'Backend';

  async loadConfiguration(): Promise<DashboardConfiguration | null> {
    throw this.createNotConfiguredError();
  }

  async saveConfiguration(_configuration: DashboardConfiguration): Promise<void> {
    throw this.createNotConfiguredError();
  }

  private createNotConfiguredError(): Error {
    return new Error(
      'Backend storage is not configured yet. Generate the OpenAPI client and add authentication first.',
    );
  }
}
