export class DashboardFeedback {
  private element: HTMLElement | null = null;

  bind(element: HTMLElement | null): void {
    this.element = element;
  }

  show(message: string): void {
    if (!this.element) {
      return;
    }

    this.element.textContent = message;
    this.element.hidden = false;
  }

  clear(): void {
    if (!this.element) {
      return;
    }

    this.element.textContent = '';
    this.element.hidden = true;
  }
}
