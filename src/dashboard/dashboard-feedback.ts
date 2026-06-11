export type DashboardFeedbackType = 'error' | 'info';

export class DashboardFeedback {
  private element: HTMLElement | null = null;

  bind(element: HTMLElement | null): void {
    this.element = element;
  }

  show(message: string, type: DashboardFeedbackType = 'error'): void {
    if (!this.element) {
      return;
    }

    this.element.textContent = message;
    this.element.dataset.type = type;
    this.element.hidden = false;
  }

  clear(): void {
    if (!this.element) {
      return;
    }

    this.element.textContent = '';
    delete this.element.dataset.type;
    this.element.hidden = true;
  }
}
