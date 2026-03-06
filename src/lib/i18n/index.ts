import { useProjectStore } from '@/store/project';
import en from './translations/en.json';
import fa from './translations/fa.json';
import ar from './translations/ar.json';

type TranslationDict = Record<string, Record<string, string>>;

const translations: Record<string, TranslationDict> = {
  'en-US': en,
  'en-GB': en,
  'fa-IR': fa,
  'ar-SA': ar,
};

const RTL_LOCALES = ['fa-IR', 'ar-SA'];

function getNestedValue(obj: TranslationDict, key: string): string {
  const parts = key.split('.');
  if (parts.length === 2) {
    return obj[parts[0]]?.[parts[1]] ?? key;
  }
  return key;
}

export function useTranslation() {
  const locale = useProjectStore((s) => s.settings.defaultLanguage);
  const dict = translations[locale] || translations['en-US'];
  const fallback = translations['en-US'];

  const t = (key: string): string => {
    const value = getNestedValue(dict, key);
    if (value !== key) return value;
    return getNestedValue(fallback, key);
  };

  const isRtl = RTL_LOCALES.includes(locale);
  const direction = isRtl ? 'rtl' as const : 'ltr' as const;

  return { t, locale, isRtl, direction };
}

export function isRtlLocale(locale: string): boolean {
  return RTL_LOCALES.includes(locale);
}

export function getDirection(locale: string): 'rtl' | 'ltr' {
  return RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';
}
