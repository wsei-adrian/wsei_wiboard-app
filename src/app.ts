import { mountDashboard } from './dashboard/dashboard';

export function mountApp(root: HTMLElement): void {
  mountDashboard(root);
}
