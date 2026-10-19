import { expect, test } from '@playwright/test';
import { defineForm, defineWizard, fields } from 'afse-formio-react/schema';
import { NativeSide } from './native';

const payment = defineForm({
  title: 'Payment',
  fields: [
    fields.text({ key: 'beneficiary', label: 'Beneficiary', required: true }),
    fields.iban({ key: 'iban', label: 'IBAN', required: true }),
    fields.amount({ key: 'amount', label: 'Amount', required: true }),
  ],
  submitButton: 'Pay',
});

const input = (key: string) => `.formio-component-${key} input`;
const payButton = 'button[name="data[submit]"]';

test('boots, renders AFSE fields and reports ready', async ({ page }) => {
  await NativeSide.open(page, { form: payment });
  await expect(page.locator(input('iban'))).toBeVisible();
  await expect(page.locator('.formio-component-afseAmount')).toBeVisible();
});

test('user fills the form on a phone and submits', async ({ page }) => {
  const native = await NativeSide.open(page, { form: payment });

  await page.locator(input('beneficiary')).fill('ACME Hellas');
  await page.locator(input('iban')).fill('GR16 0110 1250 0000 0001 2300 696');
  await page.locator(payButton).tap();
  const failed = await native.waitFor('validationError');
  expect(failed.errors).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ path: 'iban', rule: 'afseIban', message: 'IBAN must be a valid IBAN.' }),
      expect.objectContaining({ path: 'amount', rule: 'required' }),
    ]),
  );
  await expect(page.getByText('IBAN must be a valid IBAN.').first()).toBeVisible();

  await page.locator(input('iban')).fill('gr16 0110 1250 0000 0001 2300 695');
  await page.locator(input('amount')).fill('120.50');
  await page.locator(payButton).tap();
  const submitted = await native.waitFor('submit');
  expect(submitted.submission.data).toMatchObject({
    beneficiary: 'ACME Hellas',
    iban: 'GR1601101250000000012300695',
    amount: 120.5,
  });
});

test('native handle: setData, getData, validate, submit, reset', async ({ page }) => {
  const native = await NativeSide.open(page, { form: payment, hideSubmitButton: true });
  await expect(page.locator(payButton)).toHaveCount(0);

  expect((await native.call('setData', { beneficiary: 'Jane', iban: 'DE89370400440532013000' })).ok).toBe(true);
  await expect(page.locator(input('iban'))).toHaveValue('DE89370400440532013000');

  const data = await native.call('getData');
  expect(data).toMatchObject({ ok: true, value: expect.objectContaining({ beneficiary: 'Jane' }) });

  const validation = await native.call('validate');
  expect(validation).toMatchObject({ ok: true, value: [expect.objectContaining({ path: 'amount', rule: 'required' })] });

  const rejected = await native.call('submit');
  expect(rejected).toMatchObject({ ok: false, errors: [expect.objectContaining({ path: 'amount' })] });

  await native.call('setData', { amount: 99 });
  const accepted = await native.call('submit');
  expect(accepted).toMatchObject({ ok: true, value: { data: expect.objectContaining({ amount: 99 }) } });

  await native.call('reset');
  await expect(page.locator(input('beneficiary'))).toHaveValue('');
});

test('reports changes as the user types', async ({ page }) => {
  const native = await NativeSide.open(page, { form: payment });
  await page.locator(input('beneficiary')).fill('Nikos');
  const change = await native.waitFor('change', (m) => m.change.data.beneficiary === 'Nikos');
  expect(change.change.modifiedByUser).toBe(true);
});

test('Greek language, initial data and live reconfiguration', async ({ page }) => {
  const native = await NativeSide.open(page, {
    form: payment,
    language: 'el',
    data: { iban: 'GR00' },
    translations: { el: { Beneficiary: 'Δικαιούχος' } },
  });
  await expect(page.getByText('Δικαιούχος')).toBeVisible();
  const validation = await native.call('validate');
  expect(validation).toMatchObject({
    ok: true,
    value: expect.arrayContaining([expect.objectContaining({ message: 'Το πεδίο IBAN πρέπει να είναι έγκυρο IBAN.' })]),
  });

  await native.send({
    type: 'configure',
    config: { form: payment, language: 'en', readOnly: true, summary: false, hideSubmitButton: false, autoHeight: false },
  });
  await expect(page.getByText('Beneficiary')).toBeVisible();
  await expect(page.locator(input('beneficiary'))).toBeDisabled();
});

test('theme and auto height', async ({ page }) => {
  const native = await NativeSide.open(page, { form: payment, autoHeight: true, theme: { primaryColor: 'rgb(200, 0, 90)' } });
  await expect(page.locator(payButton)).toHaveCSS('background-color', 'rgb(200, 0, 90)');
  const { height } = await native.waitFor('height');
  expect(height).toBeGreaterThan(300);
  const box = await page.locator(input('iban')).boundingBox();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test('wizard steps and page events', async ({ page }) => {
  const wizard = defineWizard({
    steps: [
      { key: 'who', title: 'Who', fields: [fields.taxId({ key: 'afm', label: 'ΑΦΜ', required: true })] },
      { key: 'what', title: 'What', fields: [fields.amount({ key: 'amount', label: 'Amount' })] },
    ],
  });
  const native = await NativeSide.open(page, { form: wizard });
  await page.locator(input('afm')).fill('094014201');
  await page.getByRole('button', { name: 'Next' }).tap();
  expect((await native.waitFor('pageChange')).page).toBe(1);
  await expect(page.locator(input('amount'))).toBeVisible();
  await native.call('goToPage', 0);
  await expect(page.locator(input('afm'))).toBeVisible();
});

test('summary view shows text, not inputs', async ({ page }) => {
  await NativeSide.open(page, { form: payment, summary: true, readOnly: true, hideSubmitButton: true, data: { beneficiary: 'ACME' } });
  await expect(page.getByText('ACME')).toBeVisible();
  await expect(page.locator('input')).toHaveCount(0);
});

test('ignores messages that are not from the AFSE bridge', async ({ page }) => {
  const native = await NativeSide.open(page, { form: payment });
  await page.evaluate(() => {
    window.__afseReceive?.('{"type":"command","command":"reset"}');
    window.__afseReceive?.('not json');
  });
  await page.locator(input('beneficiary')).fill('still here');
  await expect(page.locator(input('beneficiary'))).toHaveValue('still here');
  expect((await native.messages()).filter((m) => m.type === 'error')).toEqual([]);
});
