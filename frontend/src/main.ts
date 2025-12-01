import './style.css';
import { handleLocation, route } from './pages/router.ts';

document.addEventListener('DOMContentLoaded', () => {
  handleLocation();
});

window.onpopstate = handleLocation;

document.body.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  
  if (target.matches('[data-link]')) {
    route(e);
  }
});