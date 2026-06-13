import type { DashboardConfigurationProvider } from '../storage/dashboard-configuration-provider';
import type { WidgetRegistry } from '../widgets/common/widget-registry';
import { ConfigurationProviderSelector } from './configuration-provider-selector';
import { DashboardWidgetRenderer } from './dashboard-widget-renderer';
import type {
  DashboardConfiguration,
  DashboardWidgetType,
} from './dashboard.types';
import './dashboard.scss';

export class Dashboard {
  private readonly providerSelector: ConfigurationProviderSelector;
  private readonly widgetRegistry: WidgetRegistry;
  private readonly widgetRenderer: DashboardWidgetRenderer;
  private configuration: DashboardConfiguration = { widgets: [] };
  private widgetListElement: HTMLElement | null = null;
  private feedbackElement: HTMLElement | null = null;

  constructor(
    configurationProviders: DashboardConfigurationProvider[],
    widgetRegistry: WidgetRegistry,
  ) {
    this.providerSelector = new ConfigurationProviderSelector(configurationProviders);
    this.widgetRegistry = widgetRegistry;
    this.widgetRenderer = new DashboardWidgetRenderer(widgetRegistry, {
      saveConfiguration: () => {
        void this.saveConfiguration();
      },
      removeWidget: (id) => {
        void this.removeWidget(id);
      },
    });
  }

  async mount(target: HTMLElement): Promise<void> {
    const element = this.createElement();
    target.appendChild(element);

    this.configuration = await this.loadConfiguration();
    await this.renderWidgets();
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('main');
    element.className = 'dashboard dashboard-background';
    element.innerHTML = `
      <header class="dashboard__header">
        <div>
          <h1 class="dashboard__title">WiBoard</h1>
        </div>
        <div class="dashboard__controls">
          <label class="dashboard__control">
            Storage
            <select class="dashboard__provider-select">
              ${this.createProviderOptions()}
            </select>
          </label>
          <label class="dashboard__control">
            Widget
            <select class="dashboard__widget-type-select">
              ${this.createWidgetTypeOptions()}
            </select>
          </label>
          <wa-button class="dashboard__button" type="button" variant="brand" appearance="filled">
            <wa-icon slot="start" name="plus"></wa-icon>
            Add widget
          </wa-button>
        </div>
      </header>
      <p class="dashboard__feedback" hidden></p>
      <section class="dashboard__widgets"></section>
    `;

    this.widgetListElement = element.querySelector<HTMLElement>('.dashboard__widgets');
    this.feedbackElement = element.querySelector<HTMLElement>('.dashboard__feedback');
    const addButton = element.querySelector<HTMLElement>('.dashboard__button');
    const providerSelect = element.querySelector<HTMLSelectElement>('.dashboard__provider-select');
    const widgetTypeSelect = element.querySelector<HTMLSelectElement>('.dashboard__widget-type-select');

    if (providerSelect) {
      providerSelect.value = this.getConfigurationProvider().id;
      providerSelect.addEventListener('change', () => {
        void this.changeConfigurationProvider(providerSelect.value);
      });
    }

    addButton?.addEventListener('click', () => {
      if (!widgetTypeSelect) {
        return;
      }

      void this.addWidget(widgetTypeSelect.value as DashboardWidgetType);
    });

    return element;
  }

  private async loadConfiguration(): Promise<DashboardConfiguration> {
    try {
      const configuration = await this.getConfigurationProvider().loadConfiguration();

      this.clearFeedback();

      if (configuration) {
        return configuration;
      }
    } catch (error) {
      console.error('Failed to load dashboard configuration.', error);
      this.showFeedback(
        `Could not load configuration from ${this.getConfigurationProvider().label}. Default dashboard was loaded.`,
      );
    }

    return this.createDefaultConfiguration();
  }

  private createProviderOptions(): string {
    return this.providerSelector
      .getProviders()
      .map((provider) => `<option value="${provider.id}">${provider.label}</option>`)
      .join('');
  }

  private createWidgetTypeOptions(): string {
    return this.widgetRegistry
      .getItems()
      .map((item) => `<option value="${item.type}">${item.title}</option>`)
      .join('');
  }

  private createDefaultConfiguration(): DashboardConfiguration {
    return {
      widgets: [
        {
          id: 'default-digital-clock',
          type: 'digital-clock',
          title: 'Digital clock',
          config: this.widgetRegistry.createDefaultConfig('digital-clock'),
        },
      ],
    };
  }

  private async renderWidgets(): Promise<void> {
    await this.widgetRenderer.render(this.getWidgetListElement(), this.configuration);
  }

  private async changeConfigurationProvider(providerId: string): Promise<void> {
    const provider = this.providerSelector.selectProvider(providerId);

    if (!provider) {
      return;
    }

    this.configuration = await this.loadConfiguration();
    await this.renderWidgets();
  }

  private async addWidget(type: DashboardWidgetType): Promise<void> {
    const item = this.widgetRegistry.getItem(type);

    this.configuration.widgets.push({
      id: crypto.randomUUID(),
      type: item.type,
      title: item.title,
      config: item.createDefaultConfig(),
    });

    await this.saveConfiguration();
    await this.renderWidgets();
  }

  private async removeWidget(id: string): Promise<void> {
    this.configuration.widgets = this.configuration.widgets.filter((widget) => widget.id !== id);

    await this.saveConfiguration();
    await this.renderWidgets();
  }

  private async saveConfiguration(): Promise<void> {
    try {
      await this.getConfigurationProvider().saveConfiguration(this.configuration);
      this.clearFeedback();
    } catch (error) {
      console.error('Failed to save dashboard configuration.', error);
      this.showFeedback(`Could not save configuration to ${this.getConfigurationProvider().label}.`);
    }
  }

  private getWidgetListElement(): HTMLElement {
    if (!this.widgetListElement) {
      throw new Error('Dashboard widget list is not initialized.');
    }

    return this.widgetListElement;
  }

  private getConfigurationProvider(): DashboardConfigurationProvider {
    return this.providerSelector.getActiveProvider();
  }

  private showFeedback(message: string): void {
    if (!this.feedbackElement) {
      return;
    }

    this.feedbackElement.textContent = message;
    this.feedbackElement.hidden = false;
  }

  private clearFeedback(): void {
    if (!this.feedbackElement) {
      return;
    }

    this.feedbackElement.textContent = '';
    this.feedbackElement.hidden = true;
  }
}
