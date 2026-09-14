import { createContext, useContext, type ReactNode } from 'react';
import { translations, type TranslationKey } from './translations';
import type { Language } from '../types';

interface I18nContextValue {
  lang: Language;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

export function I18nProvider({ lang, children }: { lang: Language; children: ReactNode }) {
  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const dict = translations[lang] ?? translations.en;
    let str = dict[key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
      }
    }
    return str;
  };

  return (
    <I18nContext.Provider value={{ lang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
