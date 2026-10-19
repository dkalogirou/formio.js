import { Components } from '@formio/js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CurrencyComponent: any = Components.components.currency;

/**
 * Monetary amount with AFSE defaults: EUR, two decimals, non-negative.
 */
export class AmountComponent extends CurrencyComponent {
  static schema(...extend: Record<string, unknown>[]) {
    return CurrencyComponent.schema(
      {
        type: 'afseAmount',
        label: 'Amount',
        key: 'amount',
        currency: 'EUR',
        delimiter: true,
        requireDecimal: true,
        decimalLimit: 2,
        validate: { min: 0 },
      },
      ...extend,
    );
  }

  static get builderInfo() {
    return {
      title: 'Amount (EUR)',
      icon: 'currency-euro',
      group: 'afse',
      weight: 40,
      schema: AmountComponent.schema(),
    };
  }

  get defaultSchema() {
    return AmountComponent.schema();
  }
}
