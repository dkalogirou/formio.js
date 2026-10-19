import { afseValidators } from './internal/engine';

/**
 * The AFSE domain checks, for use outside forms (e.g. API payload checks).
 * Inside forms, the matching `fields.*` helpers already apply them.
 */
export const validators: {
  /** IBAN checksum and country length; optionally restricted to `allowedCountries`. */
  iban(value: unknown, allowedCountries?: readonly string[]): boolean;
  /** Greek tax ID (ΑΦΜ). */
  greekTaxId(value: unknown): boolean;
  /** Greek social security number (ΑΜΚΑ). */
  amka(value: unknown): boolean;
  /** Formats an IBAN in groups of four. */
  formatIban(value: string): string;
} = afseValidators;
