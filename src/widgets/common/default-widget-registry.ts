import { DigitalClockWidget } from '../digital-clock/digital-clock-widget';
import { WidgetRegistry } from './widget-registry';

export function createDefaultWidgetRegistry(): WidgetRegistry {
  return new WidgetRegistry([
    {
      type: 'digital-clock',
      title: 'Digital clock',
      createWidget: () => new DigitalClockWidget(),
      createDefaultConfig: () => ({ format: 'HH:mm:ss' }),
    },
  ]);
}
