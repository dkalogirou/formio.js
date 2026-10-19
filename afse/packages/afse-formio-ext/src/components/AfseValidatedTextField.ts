import { Components } from '@formio/js';
import { afseEvalContext } from '../validators';

type FormioError = Record<string, unknown>;
type ValidateFlags = { async?: boolean; [flag: string]: unknown };

// The renderer's component classes are only reachable through the registry.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TextFieldComponent: any = Components.components.textfield;

/**
 * Base class for AFSE text inputs that carry a domain check (IBAN, ΑΦΜ, ...).
 *
 * The check runs after the core Form.io validation, so `required`, `minLength`,
 * custom validation etc. keep working, and is reported as a regular component
 * error that can be translated through the `errors` map or i18n.
 */
export abstract class AfseValidatedTextField extends TextFieldComponent {
  /** Rule name reported on the error object, e.g. `afseIban`. */
  protected abstract get afseRuleName(): string;

  /** i18n key of the error message (see `afseTranslations`). */
  protected abstract get afseErrorKey(): string;

  protected abstract isAfseValid(value: string): boolean;

  protected normalizeAfseValue(value: string): string {
    return value.trim();
  }

  normalizeValue(value: unknown, flags?: unknown): unknown {
    const normalize = (item: unknown) => (typeof item === 'string' ? this.normalizeAfseValue(item) : item);
    const normalized = Array.isArray(value) ? value.map(normalize) : normalize(value);
    return super.normalizeValue(normalized, flags);
  }

  evalContext(additional?: Record<string, unknown>): Record<string, unknown> {
    return super.evalContext({ afse: afseEvalContext, ...additional });
  }

  validateComponent(data: unknown = null, row: unknown = null, flags: ValidateFlags = {}) {
    const append = (errors: FormioError[]) => {
      const afseErrors = this.afseErrors(data, row, flags);
      this._errors = afseErrors.length ? [...errors, ...afseErrors] : errors;
      return this._errors;
    };
    const result = super.validateComponent(data, row, flags);
    return flags.async ? Promise.resolve(result).then(append) : append(result);
  }

  private afseErrors(data: unknown, row: unknown, flags: ValidateFlags): FormioError[] {
    if (this.shouldSkipValidation(data || this.rootValue, row || this.data, flags)) {
      return [];
    }
    const values: unknown[] = Array.isArray(this.dataValue) ? this.dataValue : [this.dataValue];
    const invalid = values.some((value) => typeof value === 'string' && value !== '' && !this.isAfseValid(value));
    if (!invalid) {
      return [];
    }
    return this.interpolateErrors([
      {
        errorKeyOrMessage: this.afseErrorKey,
        ruleName: this.afseRuleName,
        level: 'error',
        context: {
          field: this.errorLabel,
          path: this.path,
          index: this.rowIndex,
          value: this.dataValue,
          hasLabel: true,
        },
      },
    ]);
  }
}
