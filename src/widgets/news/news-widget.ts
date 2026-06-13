import { BaseDashboardWidget } from '../../core/widgets/base-dashboard-widget';

export interface NewsWidgetConfig {
  topic: string;
}

export class NewsWidget extends BaseDashboardWidget<NewsWidgetConfig> {
  protected createElement(): HTMLElement {
    const element = document.createElement('div');
    element.className = 'widget-news';
    element.style.display = 'flex';
    element.style.flexDirection = 'column';
    element.style.gap = '0.5rem';
    return element;
  }

  protected render(element: HTMLElement, config: NewsWidgetConfig): void {
    element.innerHTML = `
      <form class="widget-news__settings" style="display: flex; gap: 0.5rem; align-items: flex-end;">
        <wa-input 
          class="widget-news__topic-input" 
          name="topic" 
          label="Tematyka" 
          size="small" 
          value="${config.topic}" 
          placeholder="np. technologia, gospodarka, gaming">
        </wa-input>
        <wa-button class="widget-news__save-btn" type="submit" size="small" variant="brand">Szukaj</wa-button>
      </form>
      <div class="widget-news__content"></div>
    `;

    const form = element.querySelector<HTMLFormElement>('.widget-news__settings');
    const input = element.querySelector<HTMLInputElement & { value: string }>('.widget-news__topic-input');
    const content = element.querySelector<HTMLElement>('.widget-news__content');

    form?.addEventListener('submit', (e) => {
      e.preventDefault();
      if (input && input.value.trim() !== config.topic) {
        this.setConfig({ topic: input.value.trim() });
      }
    });

    if (config.topic) {
      void this.fetchNews(config.topic, content!);
    } else {
      content!.innerHTML = '<p style="margin-top: 1rem;">Brak wybranej tematyki. Wpisz temat i kliknij Szukaj.</p>';
    }
  }

  private async fetchNews(topic: string, container: HTMLElement): Promise<void> {
    try {
      container.innerHTML = '<p style="margin-top: 1rem;">Ładowanie wiadomości...</p>';
      
      // Zapytanie do Google News PL zakodowane i przekazane do rss2json w celu parsowania XML -> JSON oraz obejścia CORS
      const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(topic)}&hl=pl&gl=PL&ceid=PL:pl`;
      const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.items && Array.isArray(data.items) && data.items.length > 0) {
        // Ograniczamy widok do 4 najnowszych artykułów
        const listItems = data.items.slice(0, 4).map((post: any) => `
          <li style="margin-top: 1rem; line-height: 1.4;">
            <a href="${post.link}" target="_blank" style="display: block; font-weight: 600; color: inherit; text-decoration: none;">
              ${post.title}
            </a>
            <span style="font-size: 0.85em; color: var(--wa-color-neutral-600);">
              Źródło: Google News | Data: ${new Date(post.pubDate).toLocaleDateString('pl-PL')}
            </span>
          </li>
        `).join('');
        
        container.innerHTML = `<ul style="list-style-type: none; padding: 0; margin: 0;">${listItems}</ul>`;
      } else {
        container.innerHTML = `<p style="margin-top: 1rem;">Brak wiadomości dla tematyki: <strong>${topic}</strong>.</p>`;
      }
    } catch (error) {
      console.error('Failed to fetch news:', error);
      container.innerHTML = '<p style="color: var(--wa-color-danger-500); margin-top: 1rem;">Nie udało się pobrać wiadomości. Sprawdź połączenie.</p>';
    }
  }
}