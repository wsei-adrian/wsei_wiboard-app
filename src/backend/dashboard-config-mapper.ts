import { isDashboardConfiguration } from '../dashboard/dashboard-configuration-validation';
import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
} from '../dashboard/dashboard.types';
import {
  DashboardConfigReadDto,
  DashboardConfigWriteDto,
  JsonElement,
  WidgetConfigDto,
} from './generated/client';

const DASHBOARD_CONFIG_VERSION = 1;

export function toBackendDashboardConfig(
  configuration: DashboardConfiguration,
): DashboardConfigWriteDto {
  return new DashboardConfigWriteDto({
    version: DASHBOARD_CONFIG_VERSION,
    widgets: configuration.widgets.map(toBackendWidgetConfig),
  });
}

export function fromBackendDashboardConfig(
  dto: DashboardConfigReadDto,
): DashboardConfiguration {
  const configuration = {
    widgets: (dto.widgets ?? []).map(fromBackendWidgetConfig),
  };

  if (!isDashboardConfiguration(configuration)) {
    throw new Error('Backend returned invalid dashboard configuration.');
  }

  return configuration;
}

function toBackendWidgetConfig(
  configuration: DashboardWidgetInstanceConfiguration,
): WidgetConfigDto {
  return new WidgetConfigDto({
    id: configuration.id,
    config: JsonElement.fromJS(configuration),
  });
}

function fromBackendWidgetConfig(dto: WidgetConfigDto): DashboardWidgetInstanceConfiguration {
  return dto.config.toJSON() as DashboardWidgetInstanceConfiguration;
}
