import type { CurrentWeather, WeatherProvider } from './weather-widget.types';

interface OpenMeteoGeocodingResponse {
  results?: unknown[];
}

interface OpenMeteoGeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country?: string;
}

interface OpenMeteoForecastResponse {
  current_weather?: unknown;
}

interface OpenMeteoCurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  time?: string;
}

export class OpenMeteoWeatherProvider implements WeatherProvider {
  async getCurrentWeather(location: string): Promise<CurrentWeather | null> {
    const geocodingResult = await this.getGeocodingResult(location);

    if (!geocodingResult) {
      return null;
    }

    const currentWeather = await this.getOpenMeteoCurrentWeather(geocodingResult);

    return {
      locationName: geocodingResult.name,
      country: geocodingResult.country,
      temperatureCelsius: currentWeather.temperature,
      windSpeedKmH: currentWeather.windspeed,
      weatherCode: currentWeather.weathercode,
      observedAt: this.toDate(currentWeather.time),
      refreshedAt: new Date(),
    };
  }

  private async getGeocodingResult(
    location: string,
  ): Promise<OpenMeteoGeocodingResult | null> {
    const params = new URLSearchParams({
      name: location,
      count: '1',
      language: 'en',
      format: 'json',
    });
    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Geocoding request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OpenMeteoGeocodingResponse;
    const results = Array.isArray(data.results) ? data.results : [];

    return results.find(isOpenMeteoGeocodingResult) ?? null;
  }

  private async getOpenMeteoCurrentWeather(
    location: OpenMeteoGeocodingResult,
  ): Promise<OpenMeteoCurrentWeather> {
    const params = new URLSearchParams({
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      current_weather: 'true',
    });
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Weather request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as OpenMeteoForecastResponse;

    if (!isOpenMeteoCurrentWeather(data.current_weather)) {
      throw new Error('Weather response did not include current weather.');
    }

    return data.current_weather;
  }

  private toDate(value: string | undefined): Date | undefined {
    if (!value) {
      return undefined;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
}

function isOpenMeteoGeocodingResult(value: unknown): value is OpenMeteoGeocodingResult {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    typeof value.name === 'string' &&
    (value.country === undefined || typeof value.country === 'string')
  );
}

function isOpenMeteoCurrentWeather(value: unknown): value is OpenMeteoCurrentWeather {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.temperature === 'number' &&
    typeof value.windspeed === 'number' &&
    typeof value.weathercode === 'number' &&
    (value.time === undefined || typeof value.time === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
