// The exact same definitions work in the web app; only the import changes.
import { defineForm, defineWizard, fields } from 'afse-formio-react-native';

export type Payment = { beneficiary: string; iban: string; amount: number; urgent?: boolean };

export const paymentForm = defineForm({
  title: 'SEPA payment',
  fields: [
    fields.text({ key: 'beneficiary', label: 'Beneficiary', required: true, maxLength: 70 }),
    fields.iban({ key: 'iban', label: 'Beneficiary IBAN', required: true }),
    fields.amount({ key: 'amount', label: 'Amount', required: true, max: 15000 }),
    fields.checkbox({ key: 'urgent', label: 'Urgent transfer' }),
  ],
  submitButton: 'Pay',
});

export const onboardingWizard = defineWizard({
  title: 'Customer onboarding',
  steps: [
    {
      key: 'identity',
      title: 'Identity',
      fields: [
        fields.text({ key: 'fullName', label: 'Full name', required: true }),
        fields.taxId({ key: 'taxId', label: 'Tax ID (ΑΦΜ)', required: true }),
        fields.amka({ key: 'amka', label: 'ΑΜΚΑ' }),
      ],
    },
    {
      key: 'banking',
      title: 'Banking',
      fields: [
        fields.iban({ key: 'iban', label: 'Salary account IBAN', required: true, allowedCountries: ['GR'] }),
        fields.submit({ label: 'Open account' }),
      ],
    },
  ],
});
