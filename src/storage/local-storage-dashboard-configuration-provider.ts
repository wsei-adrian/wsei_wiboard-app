import type { DashboardConfiguration } from '../dashboard/dashboard.types';
import type { DashboardConfigurationProvider } from './dashboard-configuration-provider';

const DEFAULT_STORAGE_KEY = 'wiboard.dashboard.configuration';

export class LocalStorageDashboardConfigurationProvider implements DashboardConfigurationProvider {
  readonly id = 'local-storage';
  readonly label = 'LocalStorage';
  private readonly storageKey: string;

  constructor(storageKey = DEFAULT_STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  async loadConfiguration(): Promise<DashboardConfiguration | null> {
    try {
      const value = window.localStorage.getItem(this.storageKey);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as DashboardConfiguration;
    } catch (error) {
      console.error('Failed to load dashboard configuration from LocalStorage.', error);
      return null;
    }
  }

  async saveConfiguration(configuration: DashboardConfiguration): Promise<void> {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(configuration));
    } catch (error) {
      console.error('Failed to save dashboard configuration to LocalStorage.', error);
      throw error;
    }
  }

  async clearConfiguration(): Promise<void> {
    try {
      window.localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear dashboard configuration from LocalStorage.', error);
      throw error;
    }
  }
}
