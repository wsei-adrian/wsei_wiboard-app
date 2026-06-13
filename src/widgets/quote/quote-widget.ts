import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';
import type { Quote, QuoteProvider, QuoteWidgetConfig } from './quote-widget.types';
import './quote-widget.scss';

export class QuoteWidget extends BaseDashboardWidget<QuoteWidgetConfig> {
  private readonly providers: QuoteProvider[];
  private quote: Quote | null = null;
  private isLoading = false;
  private errorMessage: string | null = null;

  constructor(providers: QuoteProvider[]) {
    super();
    this.providers = providers;
  }

  async mount(target: HTMLElement, initialConfig: QuoteWidgetConfig): Promise<void> {
    await super.mount(target, initialConfig);
    await this.loadQuote();
  }

  setConfig(config: QuoteWidgetConfig): void {
    super.setConfig(config);
    void this.loadQuote();
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('section');
    element.className = 'quote-widget';
    return element;
  }

  protected render(element: HTMLElement, config: QuoteWidgetConfig): void {
    element.innerHTML = `
      <div class="quote-widget__controls">
        <select class="quote-widget__select">
          ${this.createProviderOptions(config.providerId)}
        </select>
        <wa-button class="quote-widget__button" type="button" appearance="outlined">
          New quote
        </wa-button>
      </div>
      ${this.createContent()}
    `;

    const select = element.querySelector<HTMLSelectElement>('.quote-widget__select');
    const button = element.querySelector<HTMLElement>('.quote-widget__button');

    select?.addEventListener('change', () => {
      this.setConfig({ providerId: select.value });
    });

    button?.addEventListener('click', () => {
      void this.loadQuote();
    });
  }

  private createProviderOptions(selectedProviderId: string): string {
    return this.providers
      .map((provider) => {
        const selected = provider.id === selectedProviderId ? 'selected' : '';
        return `<option value="${provider.id}" ${selected}>${provider.label}</option>`;
      })
      .join('');
  }

  private createContent(): string {
    if (this.isLoading) {
      return '<p class="quote-widget__state">Loading quote...</p>';
    }

    if (this.errorMessage) {
      return `<p class="quote-widget__error">${this.errorMessage}</p>`;
    }

    if (!this.quote) {
      return '<p class="quote-widget__state">No quote loaded.</p>';
    }

    const author = this.quote.author
      ? `<p class="quote-widget__author">${this.escapeHtml(this.quote.author)}</p>`
      : '';

    return `
      <blockquote class="quote-widget__quote">${this.escapeHtml(this.quote.text)}</blockquote>
      ${author}
    `;
  }

  private async loadQuote(): Promise<void> {
    try {
      this.isLoading = true;
      this.errorMessage = null;
      await this.invalidate();

      this.quote = await this.getSelectedProvider().getRandomQuote();
    } catch (error) {
      console.error('Failed to load quote.', error);
      this.errorMessage = 'Quote could not be loaded.';
    } finally {
      this.isLoading = false;
      await this.invalidate();
    }
  }

  private getSelectedProvider(): QuoteProvider {
    const config = this.getConfig();
    const provider = this.providers.find((item) => item.id === config.providerId);

    if (provider) {
      return provider;
    }

    const firstProvider = this.providers[0];

    if (!firstProvider) {
      throw new Error('Quote widget needs at least one quote provider.');
    }

    return firstProvider;
  }

  private escapeHtml(value: string): string {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
  }
}
