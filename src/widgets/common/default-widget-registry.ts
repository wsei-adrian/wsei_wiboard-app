import { DigitalClockWidget } from '../digital-clock/digital-clock-widget';
import { GoogleNewsProvider } from '../news/google-news-provider';
import { NewsWidget } from '../news/news-widget';
import { DummyJsonQuoteProvider } from '../quote/dummy-json-quote-provider';
import { LocalQuoteProvider } from '../quote/local-quote-provider';
import { QuoteWidget } from '../quote/quote-widget';
import { OpenMeteoWeatherProvider } from '../weather/open-meteo-weather-provider';
import { WeatherWidget } from '../weather/weather-widget';
import { WidgetRegistry } from './widget-registry';

export function createDefaultWidgetRegistry(): WidgetRegistry {
  return new WidgetRegistry([
    {
      type: 'digital-clock',
      title: 'Digital clock',
      createWidget: () => new DigitalClockWidget(),
      createDefaultConfig: () => ({ format: 'HH:mm:ss' }),
    },
    {
      type: 'quote',
      title: 'Quote',
      createWidget: () =>
        new QuoteWidget([new DummyJsonQuoteProvider(), new LocalQuoteProvider()]),
      createDefaultConfig: () => ({ providerId: 'dummy-json' }),
    },
    {
      type: 'news',
      title: 'News',
      createWidget: () => new NewsWidget(new GoogleNewsProvider()),
      createDefaultConfig: () => ({ topic: 'technology' }),
    },
    {
      type: 'weather',
      title: 'Weather',
      createWidget: () => new WeatherWidget(new OpenMeteoWeatherProvider()),
      createDefaultConfig: () => ({ location: 'Krakow' }),
    },
  ]);
}
