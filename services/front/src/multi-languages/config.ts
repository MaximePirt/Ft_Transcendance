import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en.json';
import fr from './locales/fr.json';
import es from './locales/es.json';

i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      es: { translation: es }
    },
    fallbackLng: 'en',
    debug: false,
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false 
    }
  });

export default i18next;