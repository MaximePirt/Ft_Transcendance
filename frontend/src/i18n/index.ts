import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enLang from './locales/en/en.json'
import frLang from './locales/fr/fr.json'

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
    },
    lng: "en",
    fallbackLng: "fr",

    interpolation: {
      escapeValue: false
    }
  });