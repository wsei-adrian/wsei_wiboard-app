import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';
import type {
  CurrentWeather,
  WeatherProvider,
  WeatherWidgetConfig,
} from './weather-widget.types';
import './weather-widget.scss';

const WEATHER_REFRESH_INTERVAL_MS = 60_000;

export class WeatherWidget extends BaseDashboardWidget<WeatherWidgetConfig> {
  private readonly provider: WeatherProvider;
  private weather: CurrentWeather | null = null;
  private isLoading = false;
  private errorMessage: string | null = null;
  private notFoundLocation: string | null = null;
  private refreshIntervalId: number | undefined;
  private requestId = 0;

  constructor(provider: WeatherProvider) {
    super();
    this.provider = provider;
  }

  async mount(target: HTMLElement, initialConfig: WeatherWidgetConfig): Promise<void> {
    await super.mount(target, initialConfig);
    this.startRefreshTimer();
    await this.loadWeather(initialConfig.location);
  }

  async unmount(): Promise<void> {
    this.stopRefreshTimer();
    await super.unmount();
  }

  setConfig(config: WeatherWidgetConfig): void {
    super.setConfig(config);
    this.startRefreshTimer();
    void this.loadWeather(config.location);
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('section');
    element.className = 'weather-widget';
    return element;
  }

  protected render(element: HTMLElement, config: WeatherWidgetConfig): void {
    element.innerHTML = `
      <form class="weather-widget__controls">
        <wa-input
          class="weather-widget__input"
          name="location"
          label="Location"
          size="small"
          value="${this.escapeAttribute(config.location)}"
          placeholder="e.g. Warsaw, London">
        </wa-input>
        <wa-button class="weather-widget__button" type="submit" size="small" variant="brand" appearance="filled">
          Update
        </wa-button>
      </form>
      ${this.createContent(config.location)}
    `;

    const form = element.querySelector<HTMLFormElement>('.weather-widget__controls');
    const input = element.querySelector<HTMLElement & { value: string }>('.weather-widget__input');

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      const location = input?.value.trim() ?? '';

      if (location === config.location) {
        void this.loadWeather(location);
        return;
      }

      this.setConfig({ location });
    });
  }

  private createContent(location: string): string {
    const normalizedLocation = location.trim();

    if (!normalizedLocation) {
      return '<p class="weather-widget__state">Enter a location to load weather.</p>';
    }

    if (this.isLoading && !this.weather) {
      return '<p class="weather-widget__state">Loading weather...</p>';
    }

    if (this.errorMessage) {
      return `<p class="weather-widget__error">${this.escapeHtml(this.errorMessage)}</p>`;
    }

    if (this.notFoundLocation) {
      return `<p class="weather-widget__warning">Location not found: ${this.escapeHtml(this.notFoundLocation)}.</p>`;
    }

    if (!this.weather) {
      return '<p class="weather-widget__state">No weather loaded.</p>';
    }

    return this.createWeatherSummary(this.weather);
  }

  private createWeatherSummary(weather: CurrentWeather): string {
    const location = [weather.locationName, weather.country].filter(Boolean).join(', ');
    const observedAt = this.formatTime(weather.observedAt);
    const refreshedAt = this.formatTime(weather.refreshedAt);
    const updating = this.isLoading
      ? '<span class="weather-widget__updating">Updating...</span>'
      : '';

    return `
      <article class="weather-widget__summary">
        <h3 class="weather-widget__place">${this.escapeHtml(location)}</h3>
        <div class="weather-widget__temperature">${weather.temperatureCelsius}&deg;C</div>
        <p class="weather-widget__condition">${this.getWeatherDescription(weather.weatherCode)}</p>
        <dl class="weather-widget__details">
          <div>
            <dt>Wind</dt>
            <dd>${weather.windSpeedKmH} km/h</dd>
          </div>
          ${observedAt ? this.createDetailsRow('Observed', observedAt) : ''}
          ${refreshedAt ? this.createDetailsRow('Updated', refreshedAt) : ''}
          ${updating ? this.createDetailsRow('Status', updating) : ''}
        </dl>
      </article>
    `;
  }

  private createDetailsRow(label: string, value: string): string {
    return `
      <div>
        <dt>${this.escapeHtml(label)}</dt>
        <dd>${value}</dd>
      </div>
    `;
  }

  private async loadWeather(
    location: string,
    keepPreviousWeather = false,
  ): Promise<void> {
    const requestId = ++this.requestId;
    const normalizedLocation = location.trim();

    if (!keepPreviousWeather) {
      this.weather = null;
    }

    this.errorMessage = null;
    this.notFoundLocation = null;
    this.isLoading = normalizedLocation.length > 0;
    await this.invalidate();

    if (!normalizedLocation) {
      return;
    }

    try {
      const weather = await this.provider.getCurrentWeather(normalizedLocation);

      if (requestId !== this.requestId) {
        return;
      }

      this.weather = weather;
      this.notFoundLocation = weather ? null : normalizedLocation;
    } catch (error) {
      if (requestId !== this.requestId) {
        return;
      }

      console.error('Failed to load weather.', error);
      this.errorMessage = 'Weather could not be loaded.';
    } finally {
      if (requestId === this.requestId) {
        this.isLoading = false;
        await this.invalidate();
      }
    }
  }

  private startRefreshTimer(): void {
    this.stopRefreshTimer();

    if (this.getConfig().location.trim().length === 0) {
      return;
    }

    this.refreshIntervalId = window.setInterval(() => {
      void this.loadWeather(this.getConfig().location, true);
    }, WEATHER_REFRESH_INTERVAL_MS);
  }

  private stopRefreshTimer(): void {
    window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = undefined;
  }

  private formatTime(value: Date | undefined): string | null {
    if (!value || Number.isNaN(value.getTime())) {
      return null;
    }

    return value.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private getWeatherDescription(code: number): string {
    if (code === 0) {
      return 'Clear sky';
    }

    if (code >= 1 && code <= 3) {
      return 'Partly cloudy';
    }

    if (code === 45 || code === 48) {
      return 'Fog';
    }

    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      return 'Rain';
    }

    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
      return 'Snow';
    }

    if (code >= 95 && code <= 99) {
      return 'Thunderstorm';
    }

    return 'Unknown conditions';
  }

  private escapeHtml(value: string): string {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value).replace(/"/g, '&quot;');
  }
}
