import type { NewsArticle, NewsProvider } from './news-widget.types';

const ARTICLE_LIMIT = 4;

interface GoogleNewsResponse {
  status?: string;
  message?: string;
  items?: unknown[];
}

interface GoogleNewsResponseItem {
  title: string;
  link: string;
  pubDate?: string;
  author?: string;
}

export class GoogleNewsProvider implements NewsProvider {
  async getArticles(topic: string): Promise<NewsArticle[]> {
    const response = await fetch(this.createApiUrl(topic));

    if (!response.ok) {
      throw new Error(`News request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as GoogleNewsResponse;

    if (data.status === 'error') {
      throw new Error(data.message ?? 'News request failed.');
    }

    const items = Array.isArray(data.items) ? data.items : [];

    return items
      .filter(isGoogleNewsResponseItem)
      .map((item) => this.toArticle(item))
      .filter((article): article is NewsArticle => article !== null)
      .slice(0, ARTICLE_LIMIT);
  }

  private createApiUrl(topic: string): string {
    const rssUrl = this.createRssUrl(topic);
    const params = new URLSearchParams({ rss_url: rssUrl });

    return `https://api.rss2json.com/v1/api.json?${params.toString()}`;
  }

  private createRssUrl(topic: string): string {
    const params = new URLSearchParams({
      q: topic,
      hl: 'pl',
      gl: 'PL',
      ceid: 'PL:pl',
    });

    return `https://news.google.com/rss/search?${params.toString()}`;
  }

  private toArticle(item: GoogleNewsResponseItem): NewsArticle | null {
    const url = this.toHttpUrl(item.link);

    if (!url) {
      return null;
    }

    return {
      title: item.title,
      url,
      source: item.author || 'Google News',
      publishedAt: item.pubDate,
    };
  }

  private toHttpUrl(value: string): string | null {
    try {
      const url = new URL(value);

      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }
}

function isGoogleNewsResponseItem(value: unknown): value is GoogleNewsResponseItem {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.title === 'string' &&
    typeof value.link === 'string' &&
    (value.pubDate === undefined || typeof value.pubDate === 'string') &&
    (value.author === undefined || typeof value.author === 'string')
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
