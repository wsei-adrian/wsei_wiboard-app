export interface Quote {
  text: string;
  author?: string;
}

export interface QuoteProvider {
  id: string;
  label: string;
  getRandomQuote(): Promise<Quote>;
}

export interface QuoteWidgetConfig {
  providerId: string;
}
