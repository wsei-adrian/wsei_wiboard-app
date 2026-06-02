import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';

import type { TestWidgetConfig } from './test-widget.types';
import './test-widget.scss';


export class TestWidget extends BaseDashboardWidget<TestWidgetConfig> {
  protected createElement(): HTMLElement {
    const element = document.createElement('section');
    element.className = 'test-widget';

    return element;
  }

  protected render(element: HTMLElement, config: TestWidgetConfig): void {
    element.innerHTML = `
      <h2>${config.title}</h2>
      <p>${config.text}</p>
    `;
  }
}
