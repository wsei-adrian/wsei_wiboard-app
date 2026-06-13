import type { DashboardWidgetWithConfigEvents } from '../core/contracts/dashboard-widget';
import type { WidgetRegistry } from '../widgets/common/widget-registry';
import type {
  DashboardConfiguration,
  DashboardWidgetInstanceConfiguration,
} from './dashboard.types';

interface DashboardWidgetRendererCallbacks {
  saveConfiguration(): void;
  removeWidget(id: string): void;
}

export class DashboardWidgetRenderer {
  private readonly widgetRegistry: WidgetRegistry;
  private readonly callbacks: DashboardWidgetRendererCallbacks;
  private readonly widgets = new Map<string, DashboardWidgetWithConfigEvents<unknown>>();

  constructor(widgetRegistry: WidgetRegistry, callbacks: DashboardWidgetRendererCallbacks) {
    this.widgetRegistry = widgetRegistry;
    this.callbacks = callbacks;
  }

  async render(target: HTMLElement, configuration: DashboardConfiguration): Promise<void> {
    await this.unmountWidgets();
    target.innerHTML = '';

    if (configuration.widgets.length === 0) {
      this.renderEmptyState(target);
      return;
    }

    for (const widgetConfiguration of configuration.widgets) {
      await this.mountWidget(target, widgetConfiguration);
    }
  }

  private renderEmptyState(target: HTMLElement): void {
    const element = document.createElement('p');
    element.className = 'dashboard__empty-state';
    element.textContent = 'No widgets yet. Add one from the dashboard controls.';

    target.appendChild(element);
  }

  private async mountWidget(
    target: HTMLElement,
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

    target.appendChild(cardElement);

    const bodyElement = cardElement.querySelector<HTMLElement>('.dashboard__widget-body');
    const removeButton = cardElement.querySelector<HTMLButtonElement>('.dashboard__icon-button');

    removeButton?.addEventListener('click', () => {
      this.callbacks.removeWidget(widgetConfiguration.id);
    });

    if (!bodyElement) {
      return;
    }

    try {
      const widget = this.widgetRegistry.createWidget(widgetConfiguration.type);
      widget.subscribeConfigUpdated((config) => {
        widgetConfiguration.config = config;
        this.callbacks.saveConfiguration();
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
}
