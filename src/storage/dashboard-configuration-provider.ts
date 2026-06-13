import type { DashboardConfiguration } from '../dashboard/dashboard.types';

export interface DashboardConfigurationProvider {
  readonly id: string;
  readonly label: string;

  loadConfiguration(): Promise<DashboardConfiguration | null>;
  saveConfiguration(configuration: DashboardConfiguration): Promise<void>;
}
