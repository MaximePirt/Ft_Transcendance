import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enLang from './locales/en/en.json'
import frLang from './locales/fr/fr.json'
import arLang from './locales/ar/ar.json'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enLang,
      },
      fr: {
        translation: frLang,
      },
      ar: {
        translation: arLang,
      },
    },
    
    lng: localStorage.getItem('language') || 'fr',
    fallbackLng: 'fr',
    returnObjects:true,

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;