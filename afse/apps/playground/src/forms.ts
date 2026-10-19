import { defineForm, defineWizard, fields } from 'afse-formio-react';

// Sections only group fields visually; their values stay top-level.
export type PaymentData = {
  taxId: string;
  amka?: string;
  beneficiary: string;
  iban: string;
  amount: number;
  urgent: boolean;
  reason?: string;
};

export const paymentForm = defineForm({
  title: 'SEPA payment',
  fields: [
    fields.section({
      key: 'payer',
      title: 'Payer',
      fields: [
        fields.taxId({ key: 'taxId', label: 'Tax ID (ΑΦΜ)', required: true }),
        fields.amka({ key: 'amka', label: 'ΑΜΚΑ' }),
      ],
    }),
    fields.text({ key: 'beneficiary', label: 'Beneficiary', required: true, maxLength: 70 }),
    fields.iban({ key: 'iban', label: 'Beneficiary IBAN', required: true, allowedCountries: ['GR', 'CY', 'DE', 'FR', 'IT'] }),
    fields.amount({ key: 'amount', label: 'Amount', required: true, max: 15000 }),
    fields.checkbox({ key: 'urgent', label: 'Urgent transfer' }),
    fields.textarea({ key: 'reason', label: 'Reason for urgency', showWhen: { field: 'urgent', equals: true } }),
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
        fields.date({ key: 'birthDate', label: 'Date of birth', required: true }),
      ],
    },
    {
      key: 'contact',
      title: 'Contact',
      fields: [
        fields.email({ key: 'email', label: 'Email', required: true }),
        fields.phone({ key: 'phone', label: 'Mobile' }),
      ],
    },
    {
      key: 'banking',
      title: 'Banking',
      fields: [
        fields.iban({ key: 'iban', label: 'Salary account IBAN', required: true, allowedCountries: ['GR'] }),
        fields.select({
          key: 'product',
          label: 'Product',
          options: [
            { label: 'Current account', value: 'current' },
            { label: 'Savings account', value: 'savings' },
          ],
        }),
        fields.submit({ label: 'Open account' }),
      ],
    },
  ],
});
