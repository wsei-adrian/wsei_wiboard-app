import type { Client } from '../backend/generated/client';
import {
  ApiException,
  DashboardConfigReadDto,
  DashboardConfigWriteDto,
  JsonElement,
  WidgetConfigDto,
} from '../backend/generated/client';
import { isDashboardConfiguration } from '../dashboard/dashboard-configuration-validation';
import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
} from '../dashboard/dashboard.types';
import type { DashboardConfigurationProvider } from './dashboard-configuration-provider';

const DASHBOARD_CONFIG_VERSION = 1;

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
      return this.fromBackendDto(dto);
    } catch (error) {
      if (this.isNotFoundError(error)) {
        return null;
      }

      throw error;
    }
  }

  async saveConfiguration(configuration: DashboardConfiguration): Promise<void> {
    await this.client.putDashboardConfig(this.toBackendDto(configuration));
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

  private toBackendDto(configuration: DashboardConfiguration): DashboardConfigWriteDto {
    return new DashboardConfigWriteDto({
      version: DASHBOARD_CONFIG_VERSION,
      widgets: configuration.widgets.map((widget) => new WidgetConfigDto({
        id: widget.id,
        config: JsonElement.fromJS(widget),
      })),
    });
  }

  private fromBackendDto(dto: DashboardConfigReadDto): DashboardConfiguration {
    const configuration = {
      widgets: (dto.widgets ?? []).map((widget) =>
        widget.config.toJSON() as DashboardWidgetInstanceConfiguration),
    };

    if (!isDashboardConfiguration(configuration)) {
      throw new Error('Backend returned invalid dashboard configuration.');
    }

    return configuration;
  }
}
