import type { Quote, QuoteProvider } from './quote-widget.types';

interface DummyJsonQuoteResponse {
  quote: string;
  author: string;
}

export class DummyJsonQuoteProvider implements QuoteProvider {
  readonly id = 'dummy-json';
  readonly label = 'DummyJSON';

  async getRandomQuote(): Promise<Quote> {
    const response = await fetch('https://dummyjson.com/quotes/random');

    if (!response.ok) {
      throw new Error(`Quote request failed with status ${response.status}.`);
    }

    const data = (await response.json()) as DummyJsonQuoteResponse;

    return {
      text: data.quote,
      author: data.author,
    };
  }
}
