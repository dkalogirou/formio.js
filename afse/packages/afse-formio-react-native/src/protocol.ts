/**
 * Messages exchanged between the React Native component and the form page
 * running inside its WebView. Both sides import this file.
 */
import type {
  AfseChange,
  AfseFormSource,
  AfseSubmission,
  AfseTranslations,
  AfseValidationError,
} from 'afse-formio-react/schema';

export const PROTOCOL = 'afse-forms/1';

export interface AfseMobileTheme {
  /** Buttons, focus rings, links. Default `#0b3d91`. */
  primaryColor?: string;
  /** Error messages and invalid fields. Default `#b42318`. */
  dangerColor?: string;
  backgroundColor?: string;
  textColor?: string;
  /** Corner radius in px. Default 8. */
  radius?: number;
  fontFamily?: string;
  /** Base font size in px. Default 16 (smaller sizes make iOS zoom into inputs). */
  fontSize?: number;
  /** Space around the form in px. Default 16. */
  padding?: number;
}

export interface HostConfig {
  form: AfseFormSource;
  data?: Record<string, unknown>;
  language: string;
  translations?: AfseTranslations;
  readOnly: boolean;
  summary: boolean;
  hideSubmitButton: boolean;
  autoHeight: boolean;
  theme?: AfseMobileTheme;
  baseUrl?: string;
  projectUrl?: string;
}

export type HostCommand = 'submit' | 'validate' | 'getData' | 'setData' | 'reset' | 'goToPage';

/** Native → page */
export type ToHost =
  | { type: 'configure'; config: HostConfig }
  | { type: 'command'; id: number; command: HostCommand; args: unknown[] };

/** Page → native */
export type FromHost =
  | { type: 'boot' }
  | { type: 'ready' }
  | { type: 'submit'; submission: AfseSubmission }
  | { type: 'change'; change: AfseChange }
  | { type: 'validationError'; errors: AfseValidationError[] }
  | { type: 'pageChange'; page: number }
  | { type: 'customEvent'; name: string; data: Record<string, unknown> }
  | { type: 'height'; height: number }
  | { type: 'result'; id: number; ok: true; value?: unknown }
  | { type: 'result'; id: number; ok: false; message: string; errors?: AfseValidationError[] }
  | { type: 'error'; message: string };

export function encode(message: ToHost | FromHost): string {
  return JSON.stringify({ protocol: PROTOCOL, message });
}

/** Returns the message, or `null` for anything that is not ours. */
export function decode<T extends ToHost | FromHost>(raw: unknown): T | null {
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const envelope = JSON.parse(raw) as { protocol?: string; message?: T };
    return envelope.protocol === PROTOCOL && envelope.message ? envelope.message : null;
  } catch {
    return null;
  }
}
