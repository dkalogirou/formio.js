import { AfseValidatedTextField } from './AfseValidatedTextField';
import { isValidIban, normalizeIban } from '../validators';

export class IbanComponent extends AfseValidatedTextField {
  static schema(...extend: Record<string, unknown>[]) {
    return AfseValidatedTextField.schema(
      {
        type: 'afseIban',
        label: 'IBAN',
        key: 'iban',
        placeholder: 'GR16 0110 1250 0000 0001 2300 695',
        spellcheck: false,
        autocomplete: 'off',
        /** ISO 3166 country codes the IBAN must belong to; empty means any. */
        allowedCountries: [],
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'IBAN',
      icon: 'bank',
      group: 'afse',
      weight: 10,
      schema: IbanComponent.schema(),
    };
  }

  static editForm(...extend: Record<string, unknown>[]) {
    return AfseValidatedTextField.editForm(
      [
        {
          key: 'validation',
          components: [
            {
              type: 'tags',
              key: 'allowedCountries',
              label: 'Allowed countries',
              tooltip: 'ISO 3166 country codes (e.g. GR, CY). Leave empty to accept any country.',
              storeas: 'array',
              input: true,
              weight: 5,
            },
          ],
        },
      ],
      ...extend,
    );
  }

  get defaultSchema() {
    return IbanComponent.schema();
  }

  protected get afseRuleName() {
    return 'afseIban';
  }

  protected get afseErrorKey() {
    return 'afseInvalidIban';
  }

  protected normalizeAfseValue(value: string) {
    return normalizeIban(value);
  }

  protected isAfseValid(value: string) {
    return isValidIban(value, this.component.allowedCountries);
  }
}
