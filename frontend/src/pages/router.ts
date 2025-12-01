import { renderHome } from '../pages/home';
import { renderGame } from '../pages/game';

const routes: Record<string, () => string> = {
  '/': renderHome,
  '/game': renderGame,
};

export const handleLocation = () => {
  const path = window.location.pathname;
  const renderFunction = routes[path] || routes['/'];
  
  const app = document.getElementById('app');
  if (app) {
    app.innerHTML = renderFunction();
  }
};

export const route = (event: Event) => {
  event = event || window.event;
  event.preventDefault();
  
  const target = event.target as HTMLAnchorElement;
  const href = target.href;
  
  window.history.pushState({}, "", href);
  
  handleLocation();
};