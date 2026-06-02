import './dashboard.scss';

export function mountDashboard(target: HTMLElement): void {
  const dashboard = document.createElement('main');
  dashboard.className = 'dashboard-background';

  target.appendChild(dashboard);
}
