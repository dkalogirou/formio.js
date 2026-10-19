import { IbanComponent } from './IbanComponent';
import { GreekTaxIdComponent } from './GreekTaxIdComponent';
import { AmkaComponent } from './AmkaComponent';
import { AmountComponent } from './AmountComponent';

export { AfseValidatedTextField } from './AfseValidatedTextField';
export { IbanComponent, GreekTaxIdComponent, AmkaComponent, AmountComponent };

/** Component classes keyed by their Form.io `type`. */
export const afseComponents = {
  afseIban: IbanComponent,
  afseTaxId: GreekTaxIdComponent,
  afseAmka: AmkaComponent,
  afseAmount: AmountComponent,
} as const;

export type AfseComponentType = keyof typeof afseComponents;
