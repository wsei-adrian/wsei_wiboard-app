import type { DashboardConfigurationProvider } from '../storage/dashboard-configuration-provider';

const ACTIVE_PROVIDER_STORAGE_KEY = 'wiboard.activeConfigurationProvider';

export class ConfigurationProviderSelector {
  private readonly providers: DashboardConfigurationProvider[];
  private readonly storageKey: string;
  private activeProvider: DashboardConfigurationProvider;

  constructor(
    providers: DashboardConfigurationProvider[],
    storageKey = ACTIVE_PROVIDER_STORAGE_KEY,
  ) {
    if (providers.length === 0) {
      throw new Error('At least one configuration provider is required.');
    }

    this.providers = providers;
    this.storageKey = storageKey;
    this.activeProvider = this.findProvider(this.loadActiveProviderId()) ?? providers[0];
  }

  getActiveProvider(): DashboardConfigurationProvider {
    return this.activeProvider;
  }

  getProviders(): DashboardConfigurationProvider[] {
    return this.providers;
  }

  selectProvider(providerId: string): DashboardConfigurationProvider | null {
    const provider = this.findProvider(providerId);

    if (!provider) {
      return null;
    }

    this.activeProvider = provider;
    this.saveActiveProviderId(provider.id);

    return provider;
  }

  private findProvider(providerId: string | null): DashboardConfigurationProvider | null {
    if (!providerId) {
      return null;
    }

    return this.providers.find((provider) => provider.id === providerId) ?? null;
  }

  private loadActiveProviderId(): string | null {
    try {
      return window.localStorage.getItem(this.storageKey);
    } catch (error) {
      console.error('Failed to load active configuration provider.', error);
      return null;
    }
  }

  private saveActiveProviderId(providerId: string): void {
    try {
      window.localStorage.setItem(this.storageKey, providerId);
    } catch (error) {
      console.error('Failed to save active configuration provider.', error);
    }
  }
}
