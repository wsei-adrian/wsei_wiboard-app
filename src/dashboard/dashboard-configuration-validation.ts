import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
  DashboardWidgetType,
} from './dashboard.types';

const WIDGET_TYPES: DashboardWidgetType[] = ['digital-clock', 'weather', 'news', 'quote'];

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
    isDashboardWidgetType(value.type) &&
    typeof value.title === 'string' &&
    'config' in value &&
    (value.position === undefined || typeof value.position === 'number')
  );
}

function isDashboardWidgetType(value: unknown): value is DashboardWidgetType {
  return typeof value === 'string' && WIDGET_TYPES.includes(value as DashboardWidgetType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
