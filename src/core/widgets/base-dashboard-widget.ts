import type { DashboardWidget } from "../contracts/dashboard-widget";

export abstract class BaseDashboardWidget<TConfig> implements DashboardWidget<TConfig> {
    protected element: HTMLElement | null = null;
    protected config: TConfig | null = null;
    
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
        if (!this.element || !this.config) {
            return;
        }

        this.render(this.element, this.config);
    }

    setConfig(config: TConfig): void {
        this.config = config;
        this.onConfigUpdated(config);
    }

    getConfig(): TConfig {
        if (!this.config) {
            throw new Error('Widget config is not initialized.');
        }

        return this.config;
    }

    onConfigUpdated(_config: TConfig): void {
        this.invalidate();
    }

    protected abstract createElement(): HTMLElement;
    protected abstract render(element: HTMLElement, config: TConfig): void;
}