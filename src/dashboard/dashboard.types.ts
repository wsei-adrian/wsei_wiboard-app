export type DashboardWidgetType = string;

export interface DashboardWidgetInstanceConfiguration {
  id: string;
  type: DashboardWidgetType;
  title: string;
  config: unknown;
  position?: number;
}

export interface DashboardConfiguration {
  widgets: DashboardWidgetInstanceConfiguration[];
}
