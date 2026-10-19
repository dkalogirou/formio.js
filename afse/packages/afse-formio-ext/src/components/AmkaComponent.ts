import { AfseValidatedTextField } from './AfseValidatedTextField';
import { isValidAmka } from '../validators';

export class AmkaComponent extends AfseValidatedTextField {
  static schema(...extend: Record<string, unknown>[]) {
    return AfseValidatedTextField.schema(
      {
        type: 'afseAmka',
        label: 'Social Security No. (ΑΜΚΑ)',
        key: 'amka',
        inputMode: 'numeric',
        autocomplete: 'off',
        validate: { maxLength: 11 },
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'ΑΜΚΑ',
      icon: 'person-badge',
      group: 'afse',
      weight: 30,
      schema: AmkaComponent.schema(),
    };
  }

  get defaultSchema() {
    return AmkaComponent.schema();
  }

  protected get afseRuleName() {
    return 'afseAmka';
  }

  protected get afseErrorKey() {
    return 'afseInvalidAmka';
  }

  protected normalizeAfseValue(value: string) {
    return value.replace(/\s+/g, '');
  }

  protected isAfseValid(value: string) {
    return isValidAmka(value);
  }
}
