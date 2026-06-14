import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';

export interface WeatherWidgetConfig {
  location: string;
}

export class WeatherWidget extends BaseDashboardWidget<WeatherWidgetConfig> {
  private refreshInterval?: number;

  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'widget-weather';
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.gap = '0.5rem';
    return element;
  }

  protected render(element: HTMLElement, config: WeatherWidgetConfig): void {
    this.clearRefreshInterval();

    element.innerHTML = `
      <form class="widget-weather__settings" style="display: flex; gap: 0.5rem; align-items: flex-end;">
        <wa-input 
          class="widget-weather__location-input" 
          name="location" 
          label="Lokalizacja" 
          size="small" 
          value="${config.location}" 
          placeholder="np. Warszawa, Londyn">
        </wa-input>
        <wa-button class="widget-weather__save-btn" type="submit" size="small" variant="brand">Zmień</wa-button>
      </form>
      <div class="widget-weather__content" style="margin-top: 1rem;"></div>
    `;

    const form = element.querySelector<HTMLFormElement>('.widget-weather__settings');
    const input = element.querySelector<HTMLInputElement & { value: string }>('.widget-weather__location-input');
    const content = element.querySelector<HTMLElement>('.widget-weather__content');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input && input.value.trim() !== config.location) {
        this.setConfig({ location: input.value.trim() });
      }
    });

    if (config.location && content) {
      void this.fetchWeather(config.location, content);
      
      this.refreshInterval = window.setInterval(() => {
        void this.fetchWeather(config.location, content);
      }, 60000);
    } else if (content) {
      content.innerHTML = '<p>Wpisz miasto, aby sprawdzić pogodę.</p>';
    }
  }

  async unmount(): Promise<void> {
    this.clearRefreshInterval();
    await super.unmount();
  }

  private clearRefreshInterval(): void {
    if (this.refreshInterval !== undefined) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = undefined;
    }
  }

  private async fetchWeather(location: string, container: HTMLElement): Promise<void> {
    try {
      const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=pl&format=json`);
      if (!geoResponse.ok) throw new Error('Błąd geolokalizacji');
      
      const geoData = await geoResponse.json();
      
      if (!geoData.results || geoData.results.length === 0) {
        container.innerHTML = `<p style="color: var(--wa-color-warning-600);">Nie znaleziono miasta: <strong>${location}</strong>.</p>`;
        return;
      }

      const { latitude, longitude, name, country } = geoData.results[0];

      const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
      if (!weatherResponse.ok) throw new Error('Błąd pobierania pogody');

      const weatherData = await weatherResponse.json();
      const current = weatherData.current_weather;
      
      const weatherDesc = this.getWeatherDescription(current.weathercode);
      const updateTime = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      container.innerHTML = `
        <div style="background: var(--wa-color-neutral-50); padding: 1rem; border-radius: 8px; border: 1px solid var(--wa-color-neutral-200);">
          <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2em;">${name}, ${country}</h3>
          <div style="font-size: 2em; font-weight: bold; color: var(--wa-color-brand-solid);">
            ${current.temperature}°C
          </div>
          <div style="margin-top: 0.5rem; font-size: 1.1em;">
            ${weatherDesc}
          </div>
          <div style="margin-top: 0.25rem; font-size: 0.9em; color: var(--wa-color-neutral-600);">
            Wiatr: ${current.windspeed} km/h
          </div>
          <div style="margin-top: 1rem; font-size: 0.75em; color: var(--wa-color-neutral-400); text-align: right;">
            Ostatnia aktualizacja: ${updateTime}
          </div>
        </div>
      `;
    } catch (error) {
      console.error('Failed to fetch weather:', error);
      container.innerHTML = '<p style="color: var(--wa-color-danger-500);">Wystąpił błąd podczas pobierania danych pogodowych.</p>';
    }
  }

  private getWeatherDescription(code: number): string {
    if (code === 0) return 'Bezchmurnie ☀️';
    if (code >= 1 && code <= 3) return 'Zmienne zachmurzenie ⛅';
    if (code === 45 || code === 48) return 'Mgła 🌫️';
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return 'Deszcz 🌧️';
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'Śnieg ❄️';
    if (code >= 95 && code <= 99) return 'Burza ⛈️';
    return 'Nieznana ❓';
  }
}