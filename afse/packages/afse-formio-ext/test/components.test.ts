import { Formio } from '@formio/js';
import { afseBuilderGroups, afseComponents, installAfseExtension } from '../src';

type FormInstance = {
  submission: { data: Record<string, unknown> };
  setSubmission: (submission: { data: Record<string, unknown> }) => Promise<unknown>;
  checkValidity: (data?: unknown, dirty?: boolean) => boolean;
  getComponent: (key: string) => { errors: { message: string }[]; dataValue: unknown; setValue: (value: unknown) => boolean };
  language: string;
  destroy: () => void;
};

async function render(components: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  const element = document.createElement('div');
  document.body.appendChild(element);
  const form = (await Formio.createForm(element, { components }, options)) as unknown as FormInstance;
  return form;
}

describe('afse-formio-ext components', () => {
  beforeAll(() => installAfseExtension());

  it('registers every AFSE component type with the renderer', () => {
    for (const type of Object.keys(afseComponents)) {
      expect(Formio.Components.components[type]).toBe(afseComponents[type as keyof typeof afseComponents]);
    }
  });

  it('is idempotent', () => {
    expect(() => installAfseExtension()).not.toThrow();
  });

  it('normalizes and validates an IBAN', async () => {
    const form = await render([{ type: 'afseIban', key: 'iban', label: 'IBAN' }]);
    const iban = form.getComponent('iban');
    iban.setValue('gr16 0110 1250 0000 0001 2300 695');
    expect(iban.dataValue).toBe('GR1601101250000000012300695');
    expect(form.submission.data.iban).toBe('GR1601101250000000012300695');
    expect(form.checkValidity(null, true)).toBe(true);

    await form.setSubmission({ data: { iban: 'GR16 0110 1250 0000 0001 2300 696' } });
    expect(form.checkValidity(null, true)).toBe(false);
    expect(form.getComponent('iban').errors[0].message).toBe('IBAN must be a valid IBAN.');
    form.destroy();
  });

  it('honours allowedCountries', async () => {
    const form = await render([{ type: 'afseIban', key: 'iban', label: 'IBAN', allowedCountries: ['GR'] }]);
    await form.setSubmission({ data: { iban: 'DE89370400440532013000' } });
    expect(form.checkValidity(null, true)).toBe(false);
    form.destroy();
  });

  it('leaves empty optional values valid and keeps core rules like required', async () => {
    const form = await render([
      { type: 'afseTaxId', key: 'optionalAfm', label: 'Optional' },
      { type: 'afseTaxId', key: 'afm', label: 'ΑΦΜ', validate: { required: true } },
    ]);
    expect(form.checkValidity(null, true)).toBe(false);
    expect(form.getComponent('optionalAfm').errors).toHaveLength(0);
    expect(form.getComponent('afm').errors[0].message).toBe('ΑΦΜ is required');
    form.destroy();
  });

  it('validates ΑΦΜ and ΑΜΚΑ', async () => {
    const form = await render([
      { type: 'afseTaxId', key: 'afm', label: 'ΑΦΜ' },
      { type: 'afseAmka', key: 'amka', label: 'ΑΜΚΑ' },
    ]);
    await form.setSubmission({ data: { afm: '094014201', amka: '01018012342' } });
    expect(form.checkValidity(null, true)).toBe(true);
    await form.setSubmission({ data: { afm: '123456789', amka: '01018012343' } });
    expect(form.checkValidity(null, true)).toBe(false);
    expect(form.getComponent('afm').errors[0].message).toBe('ΑΦΜ must be a valid Greek tax ID (ΑΦΜ).');
    expect(form.getComponent('amka').errors[0].message).toBe('ΑΜΚΑ must be a valid ΑΜΚΑ.');
    form.destroy();
  });

  it('translates errors to Greek', async () => {
    const form = await render([{ type: 'afseIban', key: 'iban', label: 'IBAN' }], { language: 'el' });
    await form.setSubmission({ data: { iban: 'GR00' } });
    form.checkValidity(null, true);
    expect(form.getComponent('iban').errors[0].message).toBe('Το πεδίο IBAN πρέπει να είναι έγκυρο IBAN.');
    form.destroy();
  });

  it('exposes afse validators to custom validation expressions', async () => {
    const form = await render([
      {
        type: 'afseIban',
        key: 'iban',
        label: 'IBAN',
        validate: { custom: "valid = afse.iban(input) && input.startsWith('CY') ? true : 'Cypriot IBAN only'" },
      },
    ]);
    await form.setSubmission({ data: { iban: 'GR1601101250000000012300695' } });
    expect(form.checkValidity(null, true)).toBe(false);
    expect(form.getComponent('iban').errors[0].message).toBe('Cypriot IBAN only');
    form.destroy();
  });

  it('defaults the amount component to EUR', () => {
    expect(afseComponents.afseAmount.schema()).toMatchObject({ type: 'afseAmount', currency: 'EUR' });
  });

  it('lists every component in the builder group', () => {
    expect(Object.keys(afseBuilderGroups.afse.components)).toEqual(Object.keys(afseComponents));
  });
});
