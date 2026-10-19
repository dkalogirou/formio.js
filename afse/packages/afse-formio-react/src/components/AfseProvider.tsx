import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { configureEndpoints } from '../internal/engine';
import type { AfseLanguage, AfseTranslations } from '../types';

export interface AfseConfig {
  /** Default language for every form and builder below the provider. */
  language: AfseLanguage;
  /** App-wide translation overrides, layered over the built-in ones. */
  translations?: AfseTranslations;
}

export interface AfseProviderProps extends Partial<AfseConfig> {
  /** Base URL of the forms API, used when forms are loaded by URL. */
  baseUrl?: string;
  /** Project URL of the forms API. */
  projectUrl?: string;
  children: ReactNode;
}

const DEFAULT_CONFIG: AfseConfig = { language: 'en' };

const AfseConfigContext = createContext<AfseConfig>(DEFAULT_CONFIG);

/**
 * Optional app-level configuration: API endpoints, default language and
 * translation overrides. Forms work without it, using English defaults.
 */
export function AfseProvider({ baseUrl, projectUrl, language = 'en', translations, children }: AfseProviderProps) {
  // Configured during render (not in an effect) so child forms that load by
  // URL already see the endpoints in their own mount effects.
  useMemo(() => configureEndpoints(baseUrl, projectUrl), [baseUrl, projectUrl]);
  const config = useMemo(() => ({ language, translations }), [language, translations]);
  return <AfseConfigContext.Provider value={config}>{children}</AfseConfigContext.Provider>;
}

export function useAfseConfig(): AfseConfig {
  return useContext(AfseConfigContext);
}
