import { defineForm, defineWizard, fields } from '../src';

describe('fields', () => {
  it('maps AFSE domain fields to the extension component types', () => {
    expect(fields.iban({ key: 'iban', label: 'IBAN', allowedCountries: ['GR'] })).toMatchObject({
      type: 'afseIban',
      allowedCountries: ['GR'],
    });
    expect(fields.taxId({ key: 'afm', label: 'ΑΦΜ' }).type).toBe('afseTaxId');
    expect(fields.amka({ key: 'amka', label: 'ΑΜΚΑ' }).type).toBe('afseAmka');
    expect(fields.amount({ key: 'amount', label: 'Amount', max: 1000 })).toMatchObject({
      type: 'afseAmount',
      currency: 'EUR',
      validate: { min: 0, max: 1000 },
    });
  });

  it('carries common settings, conditions and escape-hatch extras', () => {
    const field = fields.text({
      key: 'name',
      label: 'Name',
      required: true,
      maxLength: 50,
      showWhen: { field: 'type', equals: 'person' },
      extra: { customClass: 'wide' },
    });
    expect(field).toMatchObject({
      type: 'textfield',
      validate: { required: true, maxLength: 50 },
      conditional: { show: true, when: 'type', eq: 'person' },
      customClass: 'wide',
    });
    expect(field.validate).not.toHaveProperty('minLength');
  });

  it('adds a submit button once', () => {
    const form = defineForm({ title: 'Payment', fields: [fields.iban({ key: 'iban', label: 'IBAN' })] });
    expect(form.components.map((c) => c.type)).toEqual(['afseIban', 'button']);
    const custom = defineForm({ fields: [fields.submit({ label: 'Pay' })] });
    expect(custom.components).toHaveLength(1);
    expect(defineForm({ fields: [], submitButton: false }).components).toHaveLength(0);
  });

  it('builds wizards from steps', () => {
    const wizard = defineWizard({
      steps: [
        { key: 'who', title: 'Who', fields: [fields.taxId({ key: 'afm', label: 'ΑΦΜ' })] },
        { key: 'what', title: 'What', fields: [fields.amount({ key: 'amount', label: 'Amount' })] },
      ],
    });
    expect(wizard.display).toBe('wizard');
    expect(wizard.components.map((c) => c.type)).toEqual(['panel', 'panel']);
  });
});
