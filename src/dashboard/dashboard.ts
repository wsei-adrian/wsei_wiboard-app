import { TestWidget } from '../widgets/test-widget/test-widget';
import './dashboard.scss';

export class Dashboard {
  async mount(target: HTMLElement): Promise<void> {
    const element = this.createElement()

    const widget = new TestWidget();
    await widget.mount(element, {
      title: 'Test widget',
      text: "To jest testowy widget."
    })

    target.appendChild(element)
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('main');
    element.className = 'dashboard-background';
    return element;
  }
}
