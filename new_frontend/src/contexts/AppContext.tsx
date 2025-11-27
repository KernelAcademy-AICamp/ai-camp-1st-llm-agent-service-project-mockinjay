import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { translations, type Language } from '../i18n/translations';
import { storage } from '../utils/storage';

type Theme = 'light' | 'dark';

interface AppContextType {
  theme: Theme;
  toggleTheme: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Theme State
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = storage.get<Theme>('careguide_theme');
    return savedTheme || 'light';
  });

  // Language State
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = storage.get<Language>('careguide_language');
    return savedLang || 'ko'; // Default to Korean as per request
  });

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storage.set('careguide_theme', theme);
  }, [theme]);

  // Language Effect
  useEffect(() => {
    storage.set('careguide_language', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = translations[language];

  return (
    <AppContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
