export interface DashboardWidget<TConfig> {
  mount(target: HTMLElement, initialConfig: TConfig): Promise<void>;
  unmount(): Promise<void>;
  invalidate(): Promise<void>;
  setConfig(config: TConfig): void;
  getConfig(): TConfig;
  onConfigUpdated(callback: (config: TConfig) => void): void;
}
