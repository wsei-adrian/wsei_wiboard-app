export interface NewsArticle {
  title: string;
  url: string;
  source?: string;
  publishedAt?: string;
}

export interface NewsProvider {
  getArticles(topic: string): Promise<NewsArticle[]>;
}

export interface NewsWidgetConfig {
  topic: string;
}
