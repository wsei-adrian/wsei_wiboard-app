import type { DashboardWidgetWithConfigEvents } from '../contracts/dashboard-widget';

export abstract class BaseDashboardWidget<TConfig> implements DashboardWidgetWithConfigEvents<TConfig> {
  protected element: HTMLElement | null = null;
  protected config: TConfig | undefined;
  private readonly configUpdatedCallbacks: Array<(config: TConfig) => void> = [];

  async mount(target: HTMLElement, initialConfig: TConfig): Promise<void> {
    this.element = this.createElement();
    this.config = initialConfig;

    await this.invalidate();

    target.appendChild(this.element);
  }

  async unmount(): Promise<void> {
    this.element?.remove();
    this.element = null;
  }

  async invalidate(): Promise<void> {
    if (!this.element || this.config === undefined) {
      return;
    }

    this.render(this.element, this.config);
  }

  setConfig(config: TConfig): void {
    this.config = config;
    void this.invalidate();
    this.onConfigUpdated(config);
  }

  getConfig(): TConfig {
    if (this.config === undefined) {
      throw new Error('Widget config is not initialized.');
    }

    return this.config;
  }

  onConfigUpdated(config: TConfig): void {
    this.configUpdatedCallbacks.forEach((callback) => callback(config));
  }

  subscribeConfigUpdated(callback: (config: TConfig) => void): void {
    this.configUpdatedCallbacks.push(callback);
  }

  protected abstract createElement(): HTMLElement;
  protected abstract render(element: HTMLElement, config: TConfig): void;
}
