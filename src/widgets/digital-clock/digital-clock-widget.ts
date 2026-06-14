import type { DashboardWidgetWithSettings } from '../../core/contracts/dashboard-widget';
import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';
import type { DigitalClockFormat, DigitalClockWidgetConfig } from './digital-clock-widget.types';
import './digital-clock-widget.scss';

const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

export class DigitalClockWidget
  extends BaseDashboardWidget<DigitalClockWidgetConfig>
  implements DashboardWidgetWithSettings<DigitalClockWidgetConfig> {
  private intervalId: number | undefined;

  async mount(target: HTMLElement, initialConfig: DigitalClockWidgetConfig): Promise<void> {
    await super.mount(target, initialConfig);
    this.startTimer(initialConfig.format);
  }

  async unmount(): Promise<void> {
    this.stopTimer();
    await super.unmount();
  }

  setConfig(config: DigitalClockWidgetConfig): void {
    super.setConfig(config);
    this.startTimer(config.format);
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('section');
    element.className = 'digital-clock-widget';
    return element;
  }

  protected render(element: HTMLElement, config: DigitalClockWidgetConfig): void {
    const time = this.formatTime(new Date(), config.format);

    element.innerHTML = `
      <div class="digital-clock-widget__time">${time}</div>
    `;
  }

  renderSettings(target: HTMLElement): void {
    const config = this.getConfig();

    target.innerHTML = `
      <label class="digital-clock-widget__settings">
        Format
        <select class="digital-clock-widget__select">
          <option value="HH:mm:ss">HH:mm:ss</option>
          <option value="HH:mm">HH:mm</option>
        </select>
      </label>
    `;

    const select = target.querySelector<HTMLSelectElement>('.digital-clock-widget__select');

    if (select) {
      select.value = config.format;
      select.addEventListener('change', () => {
        this.setConfig({ format: select.value as DigitalClockFormat });
      });
    }
  }

  private startTimer(format: DigitalClockFormat): void {
    this.stopTimer();

    const delay = format === 'HH:mm:ss' ? SECOND_MS : MINUTE_MS;
    this.intervalId = window.setInterval(() => {
      void this.invalidate();
    }, delay);
  }

  private stopTimer(): void {
    window.clearInterval(this.intervalId);
    this.intervalId = undefined;
  }

  private formatTime(date: Date, format: DigitalClockFormat): string {
    const hours = this.padTimePart(date.getHours());
    const minutes = this.padTimePart(date.getMinutes());

    if (format === 'HH:mm') {
      return `${hours}:${minutes}`;
    }

    const seconds = this.padTimePart(date.getSeconds());
    return `${hours}:${minutes}:${seconds}`;
  }

  private padTimePart(value: number): string {
    return value.toString().padStart(2, '0');
  }
}
