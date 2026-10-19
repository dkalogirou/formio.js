/**
 * The demo app end to end: real app code, real afse-formio-react-native
 * component and real form page; only the native WebView is replaced by an
 * iframe (WebViewShim). Mirrors the Maestro device flows in ../.maestro.
 */
import { expect, test } from '@playwright/test';

test('payment: validation, native "Fill sample" button, submit, review, Greek', async ({ page }) => {
  await page.goto('/');
  const form = page.frameLocator('[data-testid="payment-form-webview"]');
  await expect(form.locator('.formio-component-beneficiary input')).toBeVisible({ timeout: 20_000 });

  // Tap the form's own submit button: errors reach the native side.
  await form.getByRole('button', { name: 'Pay' }).tap();
  await expect(page.getByTestId('error-count')).toHaveText('3 field(s) need attention');
  await expect(form.getByText('Beneficiary is required').first()).toBeVisible();

  // A native button fills the web form through the handle.
  await page.getByText('Fill sample').tap();
  await expect(form.locator('.formio-component-iban input')).toHaveValue('GR1601101250000000012300695');
  await form.getByRole('button', { name: 'Pay' }).tap();

  // Native screen change driven by onSubmit, then the read-only summary in a new WebView.
  await expect(page.getByTestId('payment-done')).toBeVisible();
  const summary = page.frameLocator('iframe').first();
  await expect(summary.getByText('GR1601101250000000012300695')).toBeVisible();
  await expect(summary.locator('input')).toHaveCount(0);

  await page.getByText('New payment').tap();
  await page.getByTestId('toggle-language').tap();
  await form.getByRole('button', { name: 'Pay' }).tap();
  await expect(form.getByText('Το πεδίο Beneficiary είναι υποχρεωτικό').first()).toBeVisible();
});

test('payment: typed IBAN is checked and normalised', async ({ page }) => {
  await page.goto('/');
  const form = page.frameLocator('[data-testid="payment-form-webview"]');
  await form.locator('.formio-component-beneficiary input').fill('ACME Hellas');
  await form.locator('.formio-component-iban input').fill('GR16 0110 1250 0000 0001 2300 696');
  await form.locator('.formio-component-amount input').fill('10');
  await form.getByRole('button', { name: 'Pay' }).tap();
  await expect(form.getByText('Beneficiary IBAN must be a valid IBAN.').first()).toBeVisible();
  await expect(page.getByTestId('error-count')).toHaveText('1 field(s) need attention');

  await form.locator('.formio-component-iban input').fill('gr16 0110 1250 0000 0001 2300 695');
  await form.getByRole('button', { name: 'Pay' }).tap();
  await expect(page.getByTestId('payment-done')).toBeVisible();
});

test('onboarding wizard: ΑΦΜ check blocks the next step', async ({ page }) => {
  await page.goto('/');
  await page.getByTestId('tab-wizard').tap();
  const form = page.frameLocator('[data-testid="wizard-form-webview"]');
  await form.locator('.formio-component-fullName input').fill('Maria Papadopoulou');
  await form.locator('.formio-component-taxId input').fill('123456789');
  await form.getByRole('button', { name: 'Next' }).tap();
  await expect(form.getByText('Tax ID (ΑΦΜ) must be a valid Greek tax ID (ΑΦΜ).').first()).toBeVisible();

  await form.locator('.formio-component-taxId input').fill('094014201');
  await form.getByRole('button', { name: 'Next' }).tap();
  await expect(form.getByText('Salary account IBAN')).toBeVisible();
});
