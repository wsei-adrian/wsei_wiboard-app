import type { DashboardWidget } from '../core/contracts/dashboard-widget';
import type { DashboardConfigurationProvider } from '../storage/dashboard-configuration-provider';
import type { WidgetRegistry } from '../widgets/common/widget-registry';
import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
  DashboardWidgetType,
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
        <div class="dashboard__controls">
          <select class="dashboard__widget-type-select">
            ${this.createWidgetTypeOptions()}
          </select>
          <button class="dashboard__button" type="button">Add widget</button>
        </div>
      </header>
      <section class="dashboard__widgets"></section>
    `;

    this.widgetListElement = element.querySelector<HTMLElement>('.dashboard__widgets');
    const addButton = element.querySelector<HTMLButtonElement>('.dashboard__button');
    const widgetTypeSelect = element.querySelector<HTMLSelectElement>('.dashboard__widget-type-select');

    addButton?.addEventListener('click', () => {
      if (!widgetTypeSelect) {
        return;
      }

      void this.addWidget(widgetTypeSelect.value as DashboardWidgetType);
    });

    return element;
  }

  private async loadConfiguration(): Promise<DashboardConfiguration> {
    const configuration = await this.configurationProvider.loadConfiguration();

    if (configuration) {
      return configuration;
    }

    return this.createDefaultConfiguration();
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
    const widgetListElement = this.getWidgetListElement();

    await this.unmountWidgets();
    widgetListElement.innerHTML = '';

    if (this.configuration.widgets.length === 0) {
      this.renderEmptyState(widgetListElement);
      return;
    }

    for (const widgetConfiguration of this.configuration.widgets) {
      await this.mountWidget(widgetListElement, widgetConfiguration);
    }
  }

  private renderEmptyState(widgetListElement: HTMLElement): void {
    const emptyStateElement = document.createElement('p');
    emptyStateElement.className = 'dashboard__empty-state';
    emptyStateElement.textContent = 'No widgets yet. Add one from the dashboard controls.';

    widgetListElement.appendChild(emptyStateElement);
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
        <button class="dashboard__icon-button" type="button">Remove</button>
      </header>
      <div class="dashboard__widget-body"></div>
    `;

    widgetListElement.appendChild(cardElement);

    const bodyElement = cardElement.querySelector<HTMLElement>('.dashboard__widget-body');
    const removeButton = cardElement.querySelector<HTMLButtonElement>('.dashboard__icon-button');

    removeButton?.addEventListener('click', () => {
      void this.removeWidget(widgetConfiguration.id);
    });

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
