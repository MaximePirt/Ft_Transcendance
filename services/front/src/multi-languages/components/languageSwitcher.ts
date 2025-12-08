import i18next from '../config';

export function createLanguageSwitcher(): string {
  const currentLang = i18next.language;
  
  return `
    <div class="language-switcher">
      <label for="language-select">${i18next.t('settings.language')}:</label>
      <select id="language-select" class="language-select">
        <option value="en" ${currentLang === 'en' ? 'selected' : ''}>English</option>
        <option value="fr" ${currentLang === 'fr' ? 'selected' : ''}>Français</option>
        <option value="es" ${currentLang === 'es' ? 'selected' : ''}>Español</option>
      </select>
    </div>
  `;
}

export function initLanguageSwitcher() {
  const select = document.getElementById('language-select') as HTMLSelectElement;
  
  if (select) {
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      const newLang = target.value;
      
      i18next.changeLanguage(newLang).then(() => {
        window.location.reload();
      });
    });
  }
}