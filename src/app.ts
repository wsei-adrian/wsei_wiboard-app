import { Dashboard } from './dashboard/dashboard';

export function mountApp(root: HTMLElement): void {
  const dashboard = new Dashboard();
  dashboard.mount(root);
}
