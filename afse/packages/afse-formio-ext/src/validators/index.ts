import { isValidIban } from './iban';
import { isValidGreekTaxId } from './greekTaxId';
import { isValidAmka } from './amka';

export { isValidIban, normalizeIban, formatIban } from './iban';
export { isValidGreekTaxId } from './greekTaxId';
export { isValidAmka } from './amka';

/**
 * Validators exposed to Form.io expressions as `afse.*`, so form authors can
 * write e.g. `valid = afse.iban(input) || 'Invalid IBAN'` in custom validation.
 */
export const afseEvalContext = {
  iban: isValidIban,
  greekTaxId: isValidGreekTaxId,
  amka: isValidAmka,
} as const;

export type AfseEvalContext = typeof afseEvalContext;
