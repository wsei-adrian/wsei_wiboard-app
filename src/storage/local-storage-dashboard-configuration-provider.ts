import type { DashboardConfiguration } from '../dashboard/dashboard.types';
import { isDashboardConfiguration } from '../dashboard/dashboard-configuration-validation';
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
    let value: string | null;

    try {
      value = window.localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('Failed to read dashboard configuration from LocalStorage.', error);
      throw error;
    }

    if (!value) {
      return null;
    }

    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (!isDashboardConfiguration(parsedValue)) {
        console.error('Invalid dashboard configuration in LocalStorage.');
        return null;
      }

      return parsedValue;
    } catch (error) {
      console.error('Invalid dashboard configuration in LocalStorage.', error);
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
