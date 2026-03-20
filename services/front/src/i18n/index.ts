import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enLang from './locales/en/en.json'
import frLang from './locales/fr/fr.json'
import arLang from './locales/ar/ar.json'

const supportedLanguages = ['en', 'fr', 'ar'] as const
const storedLanguage = localStorage.getItem('language')?.split('-')[0]
const initialLanguage = supportedLanguages.includes((storedLanguage as (typeof supportedLanguages)[number]) ?? 'en')
  ? storedLanguage
  : 'en'

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
    
    lng: initialLanguage,
    fallbackLng: 'en',
    returnObjects:true,

    interpolation: {
      escapeValue: false
    }
  });

export default i18n;