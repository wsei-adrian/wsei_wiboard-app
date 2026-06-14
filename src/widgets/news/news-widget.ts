import type { DashboardWidgetWithSettings } from '../../core/contracts/dashboard-widget';
import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';
import type { NewsArticle, NewsProvider, NewsWidgetConfig } from './news-widget.types';
import './news-widget.scss';

export class NewsWidget
  extends BaseDashboardWidget<NewsWidgetConfig>
  implements DashboardWidgetWithSettings<NewsWidgetConfig> {
  private readonly provider: NewsProvider;
  private articles: NewsArticle[] = [];
  private isLoading = false;
  private errorMessage: string | null = null;
  private requestId = 0;

  constructor(provider: NewsProvider) {
    super();
    this.provider = provider;
  }

  async mount(target: HTMLElement, initialConfig: NewsWidgetConfig): Promise<void> {
    await super.mount(target, initialConfig);
    await this.loadNews(initialConfig.topic);
  }

  setConfig(config: NewsWidgetConfig): void {
    super.setConfig(config);
    void this.loadNews(config.topic);
  }

  renderSettings(target: HTMLElement): void {
    const config = this.getConfig();

    target.innerHTML = `
      <form class="news-widget__controls">
        <wa-input
          class="news-widget__input"
          name="topic"
          label="Topic"
          size="small"
          value="${this.escapeAttribute(config.topic)}"
          placeholder="e.g. technology, economy, gaming">
        </wa-input>
        <wa-button class="news-widget__button" type="submit" size="small" variant="brand" appearance="filled">
          Search
        </wa-button>
      </form>
    `;

    const form = target.querySelector<HTMLFormElement>('.news-widget__controls');
    const input = target.querySelector<HTMLElement & { value: string }>('.news-widget__input');

    form?.addEventListener('submit', (event) => {
      event.preventDefault();

      const topic = input?.value.trim() ?? '';

      if (topic === config.topic) {
        void this.loadNews(topic);
        return;
      }

      this.setConfig({ topic });
    });
  }

  protected createElement(): HTMLElement {
    const element = document.createElement('section');
    element.className = 'news-widget';
    return element;
  }

  protected render(element: HTMLElement, config: NewsWidgetConfig): void {
    element.innerHTML = this.createContent(config.topic);
  }

  private createContent(topic: string): string {
    const normalizedTopic = topic.trim();

    if (!normalizedTopic) {
      return '<p class="news-widget__state">Enter a topic to load news.</p>';
    }

    if (this.isLoading) {
      return '<p class="news-widget__state">Loading news...</p>';
    }

    if (this.errorMessage) {
      return `<p class="news-widget__error">${this.escapeHtml(this.errorMessage)}</p>`;
    }

    if (this.articles.length === 0) {
      return `<p class="news-widget__state">No news found for ${this.escapeHtml(normalizedTopic)}.</p>`;
    }

    return `
      <ul class="news-widget__list">
        ${this.articles.map((article) => this.createArticleItem(article)).join('')}
      </ul>
    `;
  }

  private createArticleItem(article: NewsArticle): string {
    const source = article.source
      ? `<span>${this.escapeHtml(article.source)}</span>`
      : '';
    const date = this.formatDate(article.publishedAt);
    const publishedAt = date
      ? `<time datetime="${this.escapeAttribute(article.publishedAt ?? '')}">${date}</time>`
      : '';
    const separator = source && publishedAt ? '<span aria-hidden="true">|</span>' : '';

    return `
      <li class="news-widget__item">
        <a class="news-widget__link" href="${this.escapeAttribute(article.url)}" target="_blank" rel="noreferrer">
          ${this.escapeHtml(article.title)}
        </a>
        <p class="news-widget__meta">
          ${source}
          ${separator}
          ${publishedAt}
        </p>
      </li>
    `;
  }

  private async loadNews(topic: string): Promise<void> {
    const requestId = ++this.requestId;
    const normalizedTopic = topic.trim();

    this.articles = [];
    this.errorMessage = null;
    this.isLoading = normalizedTopic.length > 0;
    await this.invalidate();

    if (!normalizedTopic) {
      return;
    }

    try {
      const articles = await this.provider.getArticles(normalizedTopic);

      if (requestId !== this.requestId) {
        return;
      }

      this.articles = articles;
    } catch (error) {
      if (requestId !== this.requestId) {
        return;
      }

      console.error('Failed to load news.', error);
      this.errorMessage = 'News could not be loaded.';
    } finally {
      if (requestId === this.requestId) {
        this.isLoading = false;
        await this.invalidate();
      }
    }
  }

  private formatDate(value: string | undefined): string | null {
    if (!value) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private escapeHtml(value: string): string {
    const element = document.createElement('div');
    element.textContent = value;
    return element.innerHTML;
  }

  private escapeAttribute(value: string): string {
    return this.escapeHtml(value).replace(/"/g, '&quot;');
  }
}
