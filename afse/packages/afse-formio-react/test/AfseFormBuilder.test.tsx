import { render, waitFor } from '@testing-library/react';
import { AfseFormBuilder, defineForm, fields } from '../src';

describe('AfseFormBuilder', () => {
  it('shows the AFSE group with its components', async () => {
    render(<AfseFormBuilder />);
    await waitFor(() => expect(document.querySelector('[data-type="afseIban"]')).not.toBeNull());
    for (const type of ['afseTaxId', 'afseAmka', 'afseAmount']) {
      expect(document.querySelector(`[data-type="${type}"]`)).not.toBeNull();
    }
  });

  it('hides standard groups that are not requested', async () => {
    render(<AfseFormBuilder standardGroups={['basic']} />);
    await waitFor(() => expect(document.querySelector('[data-type="afseIban"]')).not.toBeNull());
    expect(document.querySelector('[data-type="textfield"]')).not.toBeNull();
    expect(document.querySelector('[data-type="datagrid"]')).toBeNull();
  });

  it('loads an initial form without mutating it', async () => {
    const initialForm = defineForm({ fields: [fields.iban({ key: 'iban', label: 'Payee IBAN' })] });
    const snapshot = JSON.stringify(initialForm);
    const { container } = render(<AfseFormBuilder initialForm={initialForm} />);
    await waitFor(() => expect(container.textContent).toContain('Payee IBAN'));
    expect(JSON.stringify(initialForm)).toBe(snapshot);
  });
});
