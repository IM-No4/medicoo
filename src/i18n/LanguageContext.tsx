import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert, I18nManager } from 'react-native';

import { LanguageInfo, SUPPORTED_LANGUAGES, SupportedLanguage, translations } from './translations';

const LANGUAGE_STORAGE_KEY = '@medicoo_consumer_selected_language';

// English text -> key, built once, for t()'s English-text lookups.
const ENGLISH_INDEX: Record<string, string> = {};
Object.keys(translations.en).forEach((k) => {
  const v = translations.en[k];
  if (!(v in ENGLISH_INDEX)) ENGLISH_INDEX[v] = k;
});

// Native layout direction is fixed at app start, so switching to/from Arabic
// only takes effect after a full restart (no restart library in this project).
const RTL_LANGUAGES: SupportedLanguage[] = ['ar'];

// Returns true when the native direction had to change (restart needed).
function syncLayoutDirection(lang: SupportedLanguage): boolean {
  const wantRTL = RTL_LANGUAGES.includes(lang);
  if (I18nManager.isRTL === wantRTL) return false;
  I18nManager.allowRTL(wantRTL);
  I18nManager.forceRTL(wantRTL);
  return true;
}

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  t: (key: string) => string;
  currentLanguageInfo: LanguageInfo;
  supportedLanguages: LanguageInfo[];
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: string) => key,
  currentLanguageInfo: SUPPORTED_LANGUAGES[0],
  supportedLanguages: SUPPORTED_LANGUAGES,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((saved) => {
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        setLanguageState(saved as SupportedLanguage);
        syncLayoutDirection(saved as SupportedLanguage);
      }
    });
  }, []);

  const setLanguage = async (lang: SupportedLanguage) => {
    setLanguageState(lang);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    if (syncLayoutDirection(lang)) {
      const dict = translations[lang] || translations.en;
      Alert.alert(
        dict.restart_required || translations.en.restart_required,
        dict.restart_message || translations.en.restart_message,
      );
    }
  };

  // `key` is normally a translation key. It may also be the English text itself
  // (used where UI strings live in module-level constants whose values double
  // as logic keys, e.g. filter ids) - those resolve through the reverse index.
  const t = (key: string): string => {
    const langDict = translations[language] || translations.en;
    const direct = langDict[key] || translations.en[key];
    if (direct) return direct;
    const viaEnglish = ENGLISH_INDEX[key];
    return viaEnglish ? langDict[viaEnglish] || key : key;
  };

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        currentLanguageInfo,
        supportedLanguages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
