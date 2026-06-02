export type DashboardWidgetType = 'digital-clock' | 'weather' | 'news' | 'quote';

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
