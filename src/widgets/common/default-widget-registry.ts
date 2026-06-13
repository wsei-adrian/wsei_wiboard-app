import { DigitalClockWidget } from '../digital-clock/digital-clock-widget';
import { DummyJsonQuoteProvider } from '../quote/dummy-json-quote-provider';
import { LocalQuoteProvider } from '../quote/local-quote-provider';
import { QuoteWidget } from '../quote/quote-widget';
import { NewsWidget } from '../news/news-widget';
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
      title: 'News Widget',
      createWidget: () => new NewsWidget(),
      createDefaultConfig: () => ({ topic: 'technology' }),
    }
  ]);
}