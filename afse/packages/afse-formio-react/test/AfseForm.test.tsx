import { act, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import {
  AfseForm,
  AfseProvider,
  AfseSubmissionView,
  defineForm,
  defineWizard,
  fields,
  validators,
  type AfseFormHandle,
} from '../src';

const paymentForm = defineForm({
  title: 'Payment',
  fields: [
    fields.text({ key: 'beneficiary', label: 'Beneficiary', required: true }),
    fields.iban({ key: 'iban', label: 'IBAN', required: true }),
    fields.amount({ key: 'amount', label: 'Amount' }),
  ],
});

type Payment = { beneficiary: string; iban: string; amount: number };

async function renderReady(ui: (onReady: () => void) => React.ReactElement) {
  let ready = false;
  const result = render(ui(() => (ready = true)));
  await waitFor(() => expect(ready).toBe(true));
  return result;
}

describe('AfseForm', () => {
  it('renders the AFSE components', async () => {
    await renderReady((onReady) => <AfseForm form={paymentForm} onReady={onReady} />);
    expect(screen.getByText('Beneficiary')).toBeInTheDocument();
    expect(document.querySelector('.formio-component-afseIban')).not.toBeNull();
    expect(document.querySelector('.formio-component-afseAmount')).not.toBeNull();
  });

  it('applies initial data and exposes it through the handle', async () => {
    const ref = createRef<AfseFormHandle<Payment>>();
    await renderReady((onReady) => (
      <AfseForm<Payment> ref={ref} form={paymentForm} data={{ beneficiary: 'ACME', iban: 'GR1601101250000000012300695' }} onReady={onReady} />
    ));
    expect(ref.current!.getData()).toMatchObject({ beneficiary: 'ACME', iban: 'GR1601101250000000012300695' });
  });

  it('reports AFSE validation errors in library terms', async () => {
    const ref = createRef<AfseFormHandle<Payment>>();
    await renderReady((onReady) => (
      <AfseForm<Payment> ref={ref} form={paymentForm} data={{ beneficiary: 'ACME', iban: 'GR00 1234' }} onReady={onReady} />
    ));
    let errors: ReturnType<AfseFormHandle['validate']> = [];
    act(() => {
      errors = ref.current!.validate();
    });
    expect(errors).toEqual([
      expect.objectContaining({ path: 'iban', label: 'IBAN', message: 'IBAN must be a valid IBAN.', rule: 'afseIban' }),
    ]);
  });

  it('submits valid data and calls onSubmit', async () => {
    const ref = createRef<AfseFormHandle<Payment>>();
    const onSubmit = vi.fn();
    await renderReady((onReady) => (
      <AfseForm<Payment>
        ref={ref}
        form={paymentForm}
        data={{ beneficiary: 'ACME', iban: 'GR1601101250000000012300695', amount: 10 }}
        onSubmit={onSubmit}
        onReady={onReady}
      />
    ));
    const submission = await act(() => ref.current!.submit());
    expect(submission.data).toMatchObject({ beneficiary: 'ACME', iban: 'GR1601101250000000012300695', amount: 10 });
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ beneficiary: 'ACME' }) }));
  });

  it('rejects submit with validation errors', async () => {
    const ref = createRef<AfseFormHandle<Payment>>();
    await renderReady((onReady) => <AfseForm<Payment> ref={ref} form={paymentForm} onReady={onReady} />);
    await act(async () => {
      await expect(ref.current!.submit()).rejects.toEqual(
        expect.arrayContaining([expect.objectContaining({ path: 'beneficiary', rule: 'required' })]),
      );
    });
  });

  it('uses the provider language and translations', async () => {
    const ref = createRef<AfseFormHandle>();
    await renderReady((onReady) => (
      <AfseProvider language="el" translations={{ el: { Beneficiary: 'Δικαιούχος' } }}>
        <AfseForm ref={ref} form={paymentForm} data={{ iban: 'GR00' }} onReady={onReady} />
      </AfseProvider>
    ));
    expect(screen.getByText('Δικαιούχος')).toBeInTheDocument();
    let errors: ReturnType<AfseFormHandle['validate']> = [];
    act(() => {
      errors = ref.current!.validate();
    });
    expect(errors.map((e) => e.message)).toContain('Το πεδίο IBAN πρέπει να είναι έγκυρο IBAN.');
  });

  it('reports changes', async () => {
    const ref = createRef<AfseFormHandle<Payment>>();
    const onChange = vi.fn();
    await renderReady((onReady) => <AfseForm<Payment> ref={ref} form={paymentForm} onChange={onChange} onReady={onReady} />);
    await act(() => ref.current!.setData({ beneficiary: 'Jane' }));
    await waitFor(() =>
      expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ beneficiary: 'Jane' }) })),
    );
  });

  it('navigates wizards', async () => {
    const ref = createRef<AfseFormHandle>();
    const wizard = defineWizard({
      steps: [
        { key: 'stepOne', title: 'Step one', fields: [fields.text({ key: 'a', label: 'First field' })] },
        { key: 'stepTwo', title: 'Step two', fields: [fields.text({ key: 'b', label: 'Second field' })] },
      ],
    });
    await renderReady((onReady) => <AfseForm ref={ref} form={wizard} onReady={onReady} />);
    expect(screen.getByText('First field')).toBeInTheDocument();
    await act(() => ref.current!.goToPage(1));
    await waitFor(() => expect(screen.getByText('Second field')).toBeInTheDocument());
  });
});

describe('AfseSubmissionView', () => {
  it('renders values as text', async () => {
    render(<AfseSubmissionView form={paymentForm} data={{ beneficiary: 'ACME', iban: 'GR1601101250000000012300695' }} />);
    await waitFor(() => expect(screen.getByText('ACME')).toBeInTheDocument());
    expect(document.querySelector('input')).toBeNull();
  });
});

describe('validators', () => {
  it('exposes the AFSE checks without the engine types', () => {
    expect(validators.iban('GR16 0110 1250 0000 0001 2300 695')).toBe(true);
    expect(validators.greekTaxId('094014201')).toBe(true);
    expect(validators.amka('01018012342')).toBe(true);
    expect(validators.formatIban('GR1601101250000000012300695')).toBe('GR16 0110 1250 0000 0001 2300 695');
  });
});
