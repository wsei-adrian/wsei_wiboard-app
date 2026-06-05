import { Dashboard } from './dashboard/dashboard';
import { LocalStorageDashboardConfigurationProvider } from './storage/local-storage-dashboard-configuration-provider';
import { createDefaultWidgetRegistry } from './widgets/common/default-widget-registry';

export function mountApp(root: HTMLElement): void {
  const configurationProvider = new LocalStorageDashboardConfigurationProvider();
  const widgetRegistry = createDefaultWidgetRegistry();
  const dashboard = new Dashboard(configurationProvider, widgetRegistry);

  void dashboard.mount(root);
}
