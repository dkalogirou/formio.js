import { AfseValidatedTextField } from './AfseValidatedTextField';
import { isValidGreekTaxId } from '../validators';

export class GreekTaxIdComponent extends AfseValidatedTextField {
  static schema(...extend: Record<string, unknown>[]) {
    return AfseValidatedTextField.schema(
      {
        type: 'afseTaxId',
        label: 'Tax ID (ΑΦΜ)',
        key: 'taxId',
        inputMode: 'numeric',
        autocomplete: 'off',
        validate: { maxLength: 9 },
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'Tax ID (ΑΦΜ)',
      icon: 'person-vcard',
      group: 'afse',
      weight: 20,
      schema: GreekTaxIdComponent.schema(),
    };
  }

  get defaultSchema() {
    return GreekTaxIdComponent.schema();
  }

  protected get afseRuleName() {
    return 'afseTaxId';
  }

  protected get afseErrorKey() {
    return 'afseInvalidTaxId';
  }

  protected normalizeAfseValue(value: string) {
    return value.replace(/\s+/g, '');
  }

  protected isAfseValid(value: string) {
    return isValidGreekTaxId(value);
  }
}
