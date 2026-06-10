import type { Quote, QuoteProvider } from './quote-widget.types';

const QUOTES: Quote[] = [
  {
    text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
  },
  {
    text: 'Praesent commodo cursus magna, vel scelerisque nisl consectetur.',
  },
  {
    text: 'Integer posuere erat a ante venenatis dapibus posuere velit aliquet.',
  },
];

export class LocalQuoteProvider implements QuoteProvider {
  readonly id = 'local';
  readonly label = 'Local quotes';

  async getRandomQuote(): Promise<Quote> {
    const index = Math.floor(Math.random() * QUOTES.length);
    return QUOTES[index];
  }
}
