import type { DashboardWidget } from '../../core/contracts/dashboard-widget';
import type { DashboardWidgetType } from '../../dashboard/dashboard.types';

export interface WidgetRegistryItem {
  type: DashboardWidgetType;
  title: string;
  createWidget(): DashboardWidget<unknown>;
  createDefaultConfig(): unknown;
}

export class WidgetRegistry {
  private readonly items = new Map<DashboardWidgetType, WidgetRegistryItem>();

  constructor(items: WidgetRegistryItem[] = []) {
    items.forEach((item) => this.register(item));
  }

  register(item: WidgetRegistryItem): void {
    this.items.set(item.type, item);
  }

  getItems(): WidgetRegistryItem[] {
    return Array.from(this.items.values());
  }

  getItem(type: DashboardWidgetType): WidgetRegistryItem {
    const item = this.items.get(type);

    if (!item) {
      throw new Error(`Widget type is not registered: ${type}`);
    }

    return item;
  }

  createWidget(type: DashboardWidgetType): DashboardWidget<unknown> {
    return this.getItem(type).createWidget();
  }

  createDefaultConfig(type: DashboardWidgetType): unknown {
    return this.getItem(type).createDefaultConfig();
  }
}
