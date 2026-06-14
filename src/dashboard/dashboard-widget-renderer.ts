import type {
  DashboardWidgetWithConfigEvents,
  DashboardWidgetWithSettings,
} from '../core/contracts/dashboard-widget';
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
        <h2 class="dashboard__widget-title">${this.escapeHtml(widgetConfiguration.title)}</h2>
        <div class="dashboard__widget-actions">
          <wa-button class="dashboard__icon-button dashboard__settings-button" type="button" appearance="plain" size="small" aria-label="Widget settings" hidden>
            <wa-icon name="gear"></wa-icon>
          </wa-button>
          <wa-button class="dashboard__icon-button dashboard__remove-button" type="button" appearance="plain" size="small" aria-label="Remove widget">
            <wa-icon name="trash"></wa-icon>
          </wa-button>
        </div>
      </header>
      <div class="dashboard__widget-body"></div>
    `;

    target.appendChild(cardElement);

    const bodyElement = cardElement.querySelector<HTMLElement>('.dashboard__widget-body');
    const settingsButton = cardElement.querySelector<HTMLElement>('.dashboard__settings-button');
    const removeButton = cardElement.querySelector<HTMLElement>('.dashboard__remove-button');

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

      if (isDashboardWidgetWithSettings(widget)) {
        if (settingsButton) {
          settingsButton.hidden = false;
          settingsButton.addEventListener('click', () => {
            this.openSettingsModal(widgetConfiguration.title, widget);
          });
        }
      }

      this.widgets.set(widgetConfiguration.id, widget);
      await widget.mount(bodyElement, widgetConfiguration.config);
    } catch (error) {
      console.error('Failed to mount widget.', error);
      bodyElement.textContent = 'Widget could not be loaded.';
    }
  }

  private openSettingsModal(
    title: string,
    widget: DashboardWidgetWithSettings<unknown>,
  ): void {
    const dialog = document.createElement('div');
    dialog.className = 'dashboard__settings-modal';
    dialog.innerHTML = `
      <section class="dashboard__settings-panel">
        <header class="dashboard__settings-header">
          <h2 class="dashboard__settings-title">${this.escapeHtml(title)} settings</h2>
          <wa-button class="dashboard__settings-close" type="button" appearance="plain" size="small" aria-label="Close settings">
            <wa-icon name="xmark"></wa-icon>
          </wa-button>
        </header>
        <div class="dashboard__settings-body"></div>
        <div class="dashboard__settings-actions">
          <wa-button class="dashboard__settings-done" type="button" variant="brand" appearance="filled">
            Done
          </wa-button>
        </div>
      </section>
    `;

    document.body.appendChild(dialog);

    const body = dialog.querySelector<HTMLElement>('.dashboard__settings-body');
    const closeButton = dialog.querySelector<HTMLElement>('.dashboard__settings-close');
    const doneButton = dialog.querySelector<HTMLElement>('.dashboard__settings-done');

    if (body) {
      widget.renderSettings(body);
    }

    const close = (): void => {
      dialog.remove();
    };

    closeButton?.addEventListener('click', close);
    doneButton?.addEventListener('click', close);
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) {
        close();
      }
    });
  }

  private async unmountWidgets(): Promise<void> {
    for (const widget of this.widgets.values()) {
      await widget.unmount();
    }

    this.widgets.clear();
  }

  private escapeHtml(value: string): string {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
  }
}

function isDashboardWidgetWithSettings(
  widget: DashboardWidgetWithConfigEvents<unknown>,
): widget is DashboardWidgetWithSettings<unknown> {
  return 'renderSettings' in widget && typeof widget.renderSettings === 'function';
}
