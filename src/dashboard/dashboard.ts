import type { DashboardWidget } from '../core/contracts/dashboard-widget';
import type { DashboardConfigurationProvider } from '../storage/dashboard-configuration-provider';
import type { WidgetRegistry } from '../widgets/common/widget-registry';
import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
} from './dashboard.types';
import './dashboard.scss';

export class Dashboard {
  private readonly configurationProvider: DashboardConfigurationProvider;
  private readonly widgetRegistry: WidgetRegistry;
  private readonly widgets = new Map<string, DashboardWidget<unknown>>();
  private configuration: DashboardConfiguration = { widgets: [] };
  private widgetListElement: HTMLElement | null = null;

  constructor(
    configurationProvider: DashboardConfigurationProvider,
    widgetRegistry: WidgetRegistry,
  ) {
    this.configurationProvider = configurationProvider;
    this.widgetRegistry = widgetRegistry;
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
          <p class="dashboard__subtitle">Configuration provider: ${this.configurationProvider.label}</p>
        </div>
      </header>
      <section class="dashboard__widgets"></section>
    `;

    this.widgetListElement = element.querySelector<HTMLElement>('.dashboard__widgets');

    return element;
  }

  private async loadConfiguration(): Promise<DashboardConfiguration> {
    const configuration = await this.configurationProvider.loadConfiguration();

    if (configuration) {
      return configuration;
    }

    return this.createDefaultConfiguration();
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
    const widgetListElement = this.getWidgetListElement();

    await this.unmountWidgets();
    widgetListElement.innerHTML = '';

    for (const widgetConfiguration of this.configuration.widgets) {
      await this.mountWidget(widgetListElement, widgetConfiguration);
    }
  }

  private async mountWidget(
    widgetListElement: HTMLElement,
    widgetConfiguration: DashboardWidgetInstanceConfiguration,
  ): Promise<void> {
    const cardElement = document.createElement('article');
    cardElement.className = 'dashboard__widget-card';
    cardElement.innerHTML = `
      <header class="dashboard__widget-header">
        <h2 class="dashboard__widget-title">${widgetConfiguration.title}</h2>
      </header>
      <div class="dashboard__widget-body"></div>
    `;

    widgetListElement.appendChild(cardElement);

    const bodyElement = cardElement.querySelector<HTMLElement>('.dashboard__widget-body');

    if (!bodyElement) {
      return;
    }

    try {
      const widget = this.widgetRegistry.createWidget(widgetConfiguration.type);
      widget.onConfigUpdated((config) => {
        widgetConfiguration.config = config;
        void this.saveConfiguration();
      });

      this.widgets.set(widgetConfiguration.id, widget);
      await widget.mount(bodyElement, widgetConfiguration.config);
    } catch (error) {
      console.error('Failed to mount widget.', error);
      bodyElement.textContent = 'Widget could not be loaded.';
    }
  }

  private async unmountWidgets(): Promise<void> {
    for (const widget of this.widgets.values()) {
      await widget.unmount();
    }

    this.widgets.clear();
  }

  private async saveConfiguration(): Promise<void> {
    await this.configurationProvider.saveConfiguration(this.configuration);
  }

  private getWidgetListElement(): HTMLElement {
    if (!this.widgetListElement) {
      throw new Error('Dashboard widget list is not initialized.');
    }

    return this.widgetListElement;
  }
}
