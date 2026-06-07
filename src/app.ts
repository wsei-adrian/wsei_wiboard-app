import { Dashboard } from './dashboard/dashboard';
import { IndexedDbDashboardConfigurationProvider } from './storage/indexed-db-dashboard-configuration-provider';
import { LocalStorageDashboardConfigurationProvider } from './storage/local-storage-dashboard-configuration-provider';
import { createDefaultWidgetRegistry } from './widgets/common/default-widget-registry';

export function mountApp(root: HTMLElement): void {
  const configurationProviders = [
    new LocalStorageDashboardConfigurationProvider(),
    new IndexedDbDashboardConfigurationProvider(),
  ];
  const widgetRegistry = createDefaultWidgetRegistry();
  const dashboard = new Dashboard(configurationProviders, widgetRegistry);

  void dashboard.mount(root);
}
