import { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { AfseLanguage, AfseTranslations } from 'afse-formio-react/schema';
import type { AfseMobileTheme } from './protocol';

export interface AfseMobileConfig {
  language: AfseLanguage;
  translations?: AfseTranslations;
  theme?: AfseMobileTheme;
  baseUrl?: string;
  projectUrl?: string;
}

export interface AfseProviderProps extends Partial<AfseMobileConfig> {
  children: ReactNode;
}

const Context = createContext<AfseMobileConfig>({ language: 'en' });

/** Optional app-wide defaults: language, translations, theme and forms API endpoints. */
export function AfseProvider({ children, language = 'en', translations, theme, baseUrl, projectUrl }: AfseProviderProps) {
  const value = useMemo(
    () => ({ language, translations, theme, baseUrl, projectUrl }),
    [language, translations, theme, baseUrl, projectUrl],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAfseConfig(): AfseMobileConfig {
  return useContext(Context);
}
