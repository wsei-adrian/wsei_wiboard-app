import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
} from './dashboard.types';

export function isDashboardConfiguration(value: unknown): value is DashboardConfiguration {
  if (!isRecord(value) || !Array.isArray(value.widgets)) {
    return false;
  }

  return value.widgets.every(isDashboardWidgetInstanceConfiguration);
}

function isDashboardWidgetInstanceConfiguration(
  value: unknown,
): value is DashboardWidgetInstanceConfiguration {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === 'string' &&
    typeof value.type === 'string' &&
    typeof value.title === 'string' &&
    'config' in value &&
    (value.position === undefined || typeof value.position === 'number')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
