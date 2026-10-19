import { useState } from 'react';
import {
  AfseForm,
  AfseFormBuilder,
  AfseProvider,
  AfseSubmissionView,
  useAfseForm,
  type AfseFormJson,
  type AfseValidationError,
} from 'afse-formio-react';
import { onboardingWizard, paymentForm, type PaymentData } from './forms';
import './app.css';

type Tab = 'payment' | 'wizard' | 'builder';

export function App() {
  const [tab, setTab] = useState<Tab>('payment');
  const [language, setLanguage] = useState<'en' | 'el'>('en');

  return (
    <AfseProvider language={language}>
      <header className="pg-header">
        <h1>AFSE Forms</h1>
        <nav>
          {(['payment', 'wizard', 'builder'] as const).map((t) => (
            <button key={t} className={t === tab ? 'active' : ''} onClick={() => setTab(t)}>
              {t === 'payment' ? 'Payment form' : t === 'wizard' ? 'Onboarding wizard' : 'Form builder'}
            </button>
          ))}
        </nav>
        <label>
          Language{' '}
          <select value={language} onChange={(e) => setLanguage(e.target.value as 'en' | 'el')}>
            <option value="en">English</option>
            <option value="el">Ελληνικά</option>
          </select>
        </label>
      </header>
      <main className="pg-main">
        {tab === 'payment' && <PaymentDemo />}
        {tab === 'wizard' && <AfseForm form={onboardingWizard} onSubmit={(s) => alert(JSON.stringify(s.data, null, 2))} />}
        {tab === 'builder' && <BuilderDemo />}
      </main>
    </AfseProvider>
  );
}

function PaymentDemo() {
  const form = useAfseForm<PaymentData>();
  const [submitted, setSubmitted] = useState<PaymentData | null>(null);
  const [errors, setErrors] = useState<AfseValidationError[]>([]);

  if (submitted) {
    return (
      <section>
        <h2>Review</h2>
        <AfseSubmissionView form={paymentForm} data={submitted} />
        <button className="btn btn-secondary" onClick={() => setSubmitted(null)}>
          New payment
        </button>
      </section>
    );
  }

  return (
    <section className="pg-columns">
      <AfseForm<PaymentData>
        ref={form.ref}
        form={paymentForm}
        data={{ beneficiary: 'ACME Hellas S.A.' }}
        onSubmit={(submission) => setSubmitted(submission.data)}
        onValidationError={setErrors}
      />
      <aside>
        <h3>Outside the form</h3>
        <button className="btn btn-outline-primary" onClick={() => setErrors(form.validate())}>
          Validate via handle
        </button>
        <button
          className="btn btn-outline-secondary"
          onClick={() => form.setData({ iban: 'GR16 0110 1250 0000 0001 2300 695', amount: 250 })}
        >
          Fill sample IBAN
        </button>
        {errors.length > 0 && (
          <ul className="pg-errors">
            {errors.map((e) => (
              <li key={e.path + e.rule}>
                <code>{e.path}</code> {e.message}
              </li>
            ))}
          </ul>
        )}
      </aside>
    </section>
  );
}

function BuilderDemo() {
  const [definition, setDefinition] = useState<AfseFormJson>(paymentForm);
  return (
    <section>
      <AfseFormBuilder initialForm={paymentForm} onChange={setDefinition} />
      <h2>Preview</h2>
      <AfseForm form={definition} />
      <details>
        <summary>Definition JSON</summary>
        <pre>{JSON.stringify(definition, null, 2)}</pre>
      </details>
    </section>
  );
}
