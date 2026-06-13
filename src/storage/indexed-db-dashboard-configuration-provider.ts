import type { DashboardConfiguration } from '../dashboard/dashboard.types';
import { isDashboardConfiguration } from '../dashboard/dashboard-configuration-validation';
import type { DashboardConfigurationProvider } from './dashboard-configuration-provider';

const DATABASE_NAME = 'wiboard';
const DATABASE_VERSION = 1;
const STORE_NAME = 'dashboard-configuration';
const CONFIGURATION_ID = 'current';

interface StoredDashboardConfiguration {
  id: string;
  configuration: DashboardConfiguration;
}

export class IndexedDbDashboardConfigurationProvider implements DashboardConfigurationProvider {
  readonly id = 'indexed-db';
  readonly label = 'IndexedDB';

  async loadConfiguration(): Promise<DashboardConfiguration | null> {
    let database: IDBDatabase | null = null;

    try {
      database = await this.openDatabase();
      const transaction = database.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const result = await this.requestToPromise<StoredDashboardConfiguration | undefined>(
        store.get(CONFIGURATION_ID),
      );

      if (!result) {
        return null;
      }

      if (!isDashboardConfiguration(result.configuration)) {
        console.error('Invalid dashboard configuration in IndexedDB.');
        return null;
      }

      return result.configuration;
    } catch (error) {
      console.error('Failed to load dashboard configuration from IndexedDB.', error);
      throw error;
    } finally {
      database?.close();
    }
  }

  async saveConfiguration(configuration: DashboardConfiguration): Promise<void> {
    const database = await this.openDatabase();

    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);

      await this.requestToPromise(
        store.put({
          id: CONFIGURATION_ID,
          configuration,
        }),
      );
    } catch (error) {
      console.error('Failed to save dashboard configuration to IndexedDB.', error);
      throw error;
    } finally {
      database.close();
    }
  }

  private openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}
