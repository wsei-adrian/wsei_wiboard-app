export interface CurrentWeather {
  locationName: string;
  country?: string;
  temperatureCelsius: number;
  windSpeedKmH: number;
  weatherCode: number;
  observedAt?: Date;
  refreshedAt: Date;
}

export interface WeatherProvider {
  getCurrentWeather(location: string): Promise<CurrentWeather | null>;
}

export interface WeatherWidgetConfig {
  location: string;
}
