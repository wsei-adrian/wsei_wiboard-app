import './core/web-awesome';
import './assets/styles/main.scss';
import { mountApp } from './app';

const app = document.querySelector<HTMLElement>('#app');

if (app) {
  mountApp(app);
}
