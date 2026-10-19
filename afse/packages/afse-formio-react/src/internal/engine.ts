/**
 * The single integration point with the rendering engine (Form.io) and the
 * AFSE extension. Nothing outside `src/internal` may import `@formio/*` or
 * `afse-formio-ext`; `scripts/check-boundaries.mjs` enforces this.
 */
import { Formio } from '@formio/js';
import { Form, FormBuilder } from '@formio/react';
import {
  afseBuilderGroups,
  afseEvalContext,
  afseTranslations,
  formatIban,
  installAfseExtension,
  isValidAmka,
  isValidGreekTaxId,
  isValidIban,
} from 'afse-formio-ext';
import type { AfseTranslations, AfseValidationError } from '../types';

export { Form as EngineForm, FormBuilder as EngineFormBuilder };

/** Minimal view of the renderer's form instance used by this library. */
export interface EngineFormInstance {
  data: Record<string, unknown>;
  submission: { _id?: string; state?: string; data: Record<string, unknown> };
  language: string;
  setPage?: (page: number) => Promise<unknown>;
  setSubmission(submission: { data: Record<string, unknown> }): Promise<unknown>;
  submit(): Promise<{ _id?: string; state?: string; data: Record<string, unknown> }>;
  checkValidity(data?: unknown, dirty?: boolean, row?: unknown, silent?: boolean): boolean;
  showErrors(errors?: unknown, triggerEvent?: boolean): unknown;
  resetValue(): void;
  setPristine(pristine: boolean): void;
  readonly errors: EngineError[];
}

export interface EngineError {
  message?: string;
  ruleName?: string;
  path?: string;
  formattedKeyOrPath?: string;
  component?: { key?: string; label?: string };
  context?: { path?: string; label?: string; key?: string };
}

export interface EngineBuilderInstance {
  form: Record<string, unknown>;
}

let configured = false;

/** Registers the AFSE extension once per page. */
export function ensureEngine(): void {
  if (!configured) {
    installAfseExtension();
    configured = true;
  }
}

export function configureEndpoints(baseUrl?: string, projectUrl?: string): void {
  if (baseUrl) {
    Formio.setBaseUrl(baseUrl);
  }
  if (projectUrl) {
    Formio.setProjectUrl(projectUrl);
  }
}

/** AFSE translations with app-provided overrides layered on top. */
export function mergeTranslations(...overrides: (AfseTranslations | undefined)[]): AfseTranslations {
  const merged: AfseTranslations = {};
  for (const source of [afseTranslations as AfseTranslations, ...overrides]) {
    for (const [language, messages] of Object.entries(source ?? {})) {
      merged[language] = { ...merged[language], ...messages };
    }
  }
  return merged;
}

export interface RendererOptionsInput {
  language: string;
  translations: AfseTranslations;
  readOnly: boolean;
  summary: boolean;
  hideSubmitButton: boolean;
}

export function rendererOptions({ language, translations, readOnly, summary, hideSubmitButton }: RendererOptionsInput) {
  return {
    language,
    i18n: translations,
    readOnly,
    renderMode: summary ? 'html' : 'form',
    noAlerts: false,
    hide: hideSubmitButton ? { submit: true } : undefined,
    // Lets authors use `afse.iban(input)` etc. in any component's custom logic.
    evalContext: { afse: afseEvalContext },
  };
}

export type StandardBuilderGroup = 'basic' | 'advanced' | 'layout' | 'data' | 'premium';

export interface BuilderOptionsInput {
  language: string;
  translations: AfseTranslations;
  standardGroups: readonly StandardBuilderGroup[];
}

const ALL_STANDARD_GROUPS: readonly StandardBuilderGroup[] = ['basic', 'advanced', 'layout', 'data', 'premium'];

export function builderOptions({ language, translations, standardGroups }: BuilderOptionsInput) {
  const hidden = Object.fromEntries(
    ALL_STANDARD_GROUPS.filter((group) => !standardGroups.includes(group)).map((group) => [group, false]),
  );
  return {
    language,
    i18n: translations,
    builder: { ...afseBuilderGroups, ...hidden },
  };
}

export function toValidationErrors(errors: readonly EngineError[] | undefined): AfseValidationError[] {
  return (errors ?? []).map((error) => ({
    path: error.formattedKeyOrPath ?? error.context?.path ?? error.path ?? error.component?.key ?? '',
    label: error.component?.label ?? error.context?.label,
    message: error.message ?? '',
    rule: error.ruleName,
  }));
}

export const afseValidators = {
  iban: isValidIban,
  greekTaxId: isValidGreekTaxId,
  amka: isValidAmka,
  formatIban,
};
