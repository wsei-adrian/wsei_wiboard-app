import { BackendAuthService } from './backend/backend-auth-service';
import { createBackendClient } from './backend/client';
import { Dashboard } from './dashboard/dashboard';
import { BackendDashboardConfigurationProvider } from './storage/backend-dashboard-configuration-provider';
import { IndexedDbDashboardConfigurationProvider } from './storage/indexed-db-dashboard-configuration-provider';
import { LocalStorageDashboardConfigurationProvider } from './storage/local-storage-dashboard-configuration-provider';
import { createDefaultWidgetRegistry } from './widgets/common/default-widget-registry';

export function mountApp(root: HTMLElement): void {
  const backendAuthService = new BackendAuthService(createBackendClient());
  const backendClient = createBackendClient(backendAuthService);
  const configurationProviders = [
    new LocalStorageDashboardConfigurationProvider(),
    new IndexedDbDashboardConfigurationProvider(),
    new BackendDashboardConfigurationProvider(backendClient),
  ];
  const widgetRegistry = createDefaultWidgetRegistry();
  const dashboard = new Dashboard(configurationProviders, widgetRegistry);

  void dashboard.mount(root);
}
