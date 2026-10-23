import { useEffect, useCallback } from 'react';
import { useTranslation as useI18nextTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import legacyTranslations from '../locales/i18n.js';

const getByPath = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), obj);
};

export const useTranslation = () => {
  const { language = 'ar', isRtl: appIsRtl } = useAppContext();
  const lang = language === 'ar' ? 'ar' : language;
  const { t: translate, i18n } = useI18nextTranslation();

  // المزامنة التلقائية للغة مع i18next
  useEffect(() => {
    if (i18n && typeof i18n.changeLanguage === 'function' && i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [i18n, lang]);

  const t = useCallback(
    (key, vars = {}) => {
      if (!key) return '';

      // 1. تجربة الترجمة باستخدام i18next
      if (typeof translate === 'function') {
        const translated = translate(key, vars);
        // نتحققوا أن الترجمة كاينا وما رجعاتش نفس الـ Key
        if (translated !== undefined && translated !== key) {
          return translated;
        }
      }

      // 2. الرجوع إلى القاموس القديم (Legacy Dictionary Fallback)
      const section = key.split('.')[0];
      const legacyDict = legacyTranslations?.[section]?.[lang] || legacyTranslations?.[section]?.en || {};
      const relativePath = key.split('.').slice(1).join('.');
      const legacyValue = relativePath ? getByPath(legacyDict, relativePath) : getByPath(legacyTranslations, key);

      if (legacyValue !== undefined) {
        if (typeof legacyValue !== 'string') return legacyValue;
        return legacyValue.replace(/\{\{(.*?)\}\}/g, (_, variable) => String(vars[variable.trim()] ?? ''));
      }

      // 3. إرجاع الـ Key كما هو في حالة عدم العثور عليه
      return key;
    },
    [lang, translate]
  );

  const isRtl = lang === 'ar' || Boolean(appIsRtl);

  return {
    t,
    language: lang,
    isRtl,
  };
};

export default useTranslation;