export interface DashboardWidget<TConfig> {
  mount(target: HTMLElement, initialConfig: TConfig): Promise<void>;
  unmount(): Promise<void>;
  invalidate(): Promise<void>;
  setConfig(config: TConfig): void;
  getConfig(): TConfig;
  onConfigUpdated(config: TConfig): void;
}

export interface DashboardWidgetWithConfigEvents<TConfig> extends DashboardWidget<TConfig> {
  subscribeConfigUpdated(callback: (config: TConfig) => void): void;
}

export interface DashboardWidgetWithSettings<TConfig>
  extends DashboardWidgetWithConfigEvents<TConfig> {
  renderSettings(target: HTMLElement): void;
}
