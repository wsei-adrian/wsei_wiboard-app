import type { DashboardConfigurationProvider } from '../storage/dashboard-configuration-provider';
import type { WidgetRegistry } from '../widgets/common/widget-registry';
import { ConfigurationProviderSelector } from './configuration-provider-selector';
import { DashboardFeedback } from './dashboard-feedback';
import { DashboardWidgetRenderer } from './dashboard-widget-renderer';
import type {
  DashboardConfiguration,
  DashboardWidgetType,
} from './dashboard.types';
import './dashboard.scss';

interface DashboardConfigurationLoadResult {
  configuration: DashboardConfiguration;
  failed: boolean;
}

export class Dashboard {
  private readonly providerSelector: ConfigurationProviderSelector;
  private readonly widgetRegistry: WidgetRegistry;
  private readonly feedback = new DashboardFeedback();
  private readonly widgetRenderer: DashboardWidgetRenderer;
  private configuration: DashboardConfiguration = { widgets: [] };
  private widgetListElement: HTMLElement | null = null;
  private providerLabelElement: HTMLElement | null = null;

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

    const loadResult = await this.loadConfiguration();
    this.configuration = loadResult.configuration;
    await this.renderWidgets();
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('main');
    element.className = 'dashboard dashboard-background';
    element.innerHTML = `
      <header class="dashboard__header">
        <div>
          <h1 class="dashboard__title">WiBoard</h1>
          <p class="dashboard__subtitle">
            Configuration provider:
            <span class="dashboard__provider-label">${this.getConfigurationProvider().label}</span>
          </p>
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
          <button class="dashboard__button" type="button">Add widget</button>
        </div>
      </header>
      <p class="dashboard__feedback" hidden></p>
      <section class="dashboard__widgets"></section>
    `;

    this.widgetListElement = element.querySelector<HTMLElement>('.dashboard__widgets');
    this.providerLabelElement = element.querySelector<HTMLElement>('.dashboard__provider-label');
    this.feedback.bind(element.querySelector<HTMLElement>('.dashboard__feedback'));
    const addButton = element.querySelector<HTMLButtonElement>('.dashboard__button');
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

  private async loadConfiguration(): Promise<DashboardConfigurationLoadResult> {
    try {
      const configuration = await this.getConfigurationProvider().loadConfiguration();

      this.feedback.clear();

      if (configuration) {
        return {
          configuration,
          failed: false,
        };
      }
    } catch (error) {
      console.error('Failed to load dashboard configuration.', error);
      this.feedback.show(
        `Could not load configuration from ${this.getConfigurationProvider().label}. Default dashboard was loaded.`,
      );

      return {
        configuration: this.createDefaultConfiguration(),
        failed: true,
      };
    }

    return {
      configuration: this.createDefaultConfiguration(),
      failed: false,
    };
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

    this.updateProviderLabel();

    const loadResult = await this.loadConfiguration();
    this.configuration = loadResult.configuration;
    await this.renderWidgets();
  }

  private updateProviderLabel(): void {
    if (this.providerLabelElement) {
      this.providerLabelElement.textContent = this.getConfigurationProvider().label;
    }
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
      this.feedback.clear();
    } catch (error) {
      console.error('Failed to save dashboard configuration.', error);
      this.feedback.show(`Could not save configuration to ${this.getConfigurationProvider().label}.`);
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
}
