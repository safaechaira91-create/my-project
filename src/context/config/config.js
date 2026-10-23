import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ar from '../../locales/ar.json';
import en from '../../locales/en.json';
import fr from '../../locales/fr.json';
import es from '../../locales/es.json';
import de from '../../locales/de.json';

const resources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
  es: { translation: es },
  de: { translation: de },
};

const applyLanguageAttributes = (lng) => {
  const currentLang = lng ? lng.split('-')[0] : 'ar';
  const isRtl = currentLang === 'ar';

  document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  document.documentElement.lang = currentLang;
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    supportedLngs: ['ar', 'en', 'fr', 'es', 'de'],
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'cookie', 'navigator', 'htmlTag'],
      caches: ['localStorage', 'cookie'],
    },
  });

// ضبط الاتجاه عند التشغيل أول مرة
applyLanguageAttributes(i18n.language || 'ar');

// الاستماع لتغيير اللغة
i18n.on('languageChanged', (lng) => {
  applyLanguageAttributes(lng);
});

export default i18n;