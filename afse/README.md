# AFSE Forms — React component library on Form.io

This workspace holds AFSE's form library, built on the open-source Form.io
renderer at its latest release, **`@formio/js` 5.7.0** (the head of the
upstream `formio/formio.js` `main` branch).

| Package | What it is | Who imports it |
| --- | --- | --- |
| [`afse-formio-react`](packages/afse-formio-react) | The React component library: `AfseForm`, `AfseFormBuilder`, `AfseSubmissionView`, `AfseProvider`, `useAfseForm`, typed `fields`/`defineForm` helpers, `validators`, theme CSS. | Applications |
| [`afse-formio-ext`](packages/afse-formio-ext) | AFSE's extension to Form.io: domain components (IBAN, ΑΦΜ, ΑΜΚΑ, EUR amount), validators, builder group, Greek translations. Framework-agnostic. | `afse-formio-react` only |
| [`afse-formio-react-native`](packages/afse-formio-react-native) | Drop-in React Native / Expo plugin: `<AfseForm>` with the same props, forms, AFSE components and translations, plus `theme` and `autoHeight`. | Mobile apps |
| [`apps/playground`](apps/playground) | Vite demo app: payment form, onboarding wizard, form builder. | — |
| [`apps/mobile-playground`](apps/mobile-playground) | Expo demo app with Maestro device flows. | — |

## Boundaries

```
   application
        │  imports only "afse-formio-react" (+ "afse-formio-react/styles.css")
        ▼
 ┌──────────────────────── afse-formio-react ───────────────────────┐
 │  components/  hooks/  schema/  types.ts   ← public, engine-free  │
 │        │                                                         │
 │        ▼                                                         │
 │  internal/engine.ts  ← the ONLY module that imports the engine   │
 └────────┬───────────────────────────────┬─────────────────────────┘
          ▼                               ▼
   afse-formio-ext  ───────────────▶  @formio/js 5.7 / @formio/react 6.2
   (public Form.io API only, no React)

   mobile app
        │  imports only "afse-formio-react-native"
        ▼
 ┌───────────────── afse-formio-react-native ─────────────────┐
 │  native side: <AfseForm> ── WebView ──┐                    │
 │  (uses only afse-formio-react/schema) │  protocol.ts       │
 │                                       ▼                    │
 │  host page (bundled HTML) ──▶ afse-formio-react (public)   │
 └────────────────────────────────────────────────────────────┘
```

`afse-formio-react/schema` is the platform-free part of the web library
(`defineForm`, `fields`, `validators`, types). It is what lets the native side
share form definitions without loading the browser engine.

Think of Form.io as the engine of a car, `afse-formio-ext` as AFSE's custom
parts fitted to that engine, and `afse-formio-react` as the dashboard: drivers
(apps) only ever touch the dashboard, so the engine or the parts can be
swapped or upgraded without retraining anyone.

The rules are checked by `npm run check:boundaries`
([scripts/check-boundaries.mjs](scripts/check-boundaries.mjs)):

1. Inside `afse-formio-react`, only `src/internal/**` may import `@formio/*` or `afse-formio-ext`.
2. `afse-formio-react`'s published `.d.ts` files mention neither, so no engine type leaks into apps.
3. `afse-formio-ext` uses only the engine's public entry points (no deep `@formio/js/lib/...` imports) and never imports React.
4. Web apps import `afse-formio-react` (and its stylesheet) only.
5. `afse-formio-react/schema` stays free of the engine, the components and React.
6. `afse-formio-react-native`'s native code imports only React Native, the WebView and `afse-formio-react/schema`; its WebView page uses only the public `afse-formio-react` API.
7. Mobile apps import `afse-formio-react-native` only.

`afse-formio-react` lists the engine and the extension as regular
`dependencies`; apps never install or configure them.

## Using the library

```tsx
import 'afse-formio-react/styles.css';
import { AfseForm, AfseProvider, defineForm, fields, useAfseForm } from 'afse-formio-react';

const payment = defineForm({
  title: 'SEPA payment',
  fields: [
    fields.taxId({ key: 'taxId', label: 'Tax ID (ΑΦΜ)', required: true }),
    fields.iban({ key: 'iban', label: 'IBAN', required: true, allowedCountries: ['GR', 'CY'] }),
    fields.amount({ key: 'amount', label: 'Amount', max: 15000 }),
  ],
  submitButton: 'Pay',
});

type Payment = { taxId: string; iban: string; amount: number };

export function PaymentPage() {
  const form = useAfseForm<Payment>();
  return (
    <AfseProvider language="el">
      <AfseForm<Payment>
        ref={form.ref}
        form={payment}
        onSubmit={({ data }) => api.pay(data)}
        onValidationError={(errors) => console.table(errors)}
      />
    </AfseProvider>
  );
}
```

* `form` accepts a definition (from `defineForm`/`defineWizard`, the builder,
  or your backend) or the URL of a form on a Form.io-compatible API
  (`AfseProvider baseUrl`/`projectUrl`).
* The `ref` handle (or `useAfseForm`) offers `submit()`, `validate()`,
  `getData()`, `setData()`, `reset()` and `goToPage()`. Errors come back as
  `AfseValidationError { path, label, message, rule }`.
* `AfseFormBuilder` shows the AFSE group first; `standardGroups` picks which
  standard groups appear next to it. Its `onChange` output can be saved and
  rendered later with `AfseForm`.
* `AfseSubmissionView` renders a submission as read-only text for review screens.
* `validators.iban/greekTaxId/amka` give the same checks outside forms.
* Built-in languages: `en`, `el`. Add or override strings with
  `translations={{ el: { Beneficiary: 'Δικαιούχος' } }}` on the provider or a form.
* Theme with CSS variables: `--afse-primary`, `--afse-danger`, `--afse-radius`,
  `--afse-field-gap`, `--afse-font`.

Fields: `text`, `textarea`, `email`, `phone`, `number`, `date`, `select`,
`radio`, `checkbox`, `iban`, `taxId`, `amka`, `amount`, `section`, `list`,
`content`, `submit`, `action`. Each takes `extra` for engine settings the
helpers do not cover yet; prefer adding a helper option instead.

## Extending AFSE components

A new domain field goes into `afse-formio-ext`, then gets a typed helper in
`afse-formio-react`:

1. **Validator:** add a pure function to `packages/afse-formio-ext/src/validators/` and to `afseEvalContext`.
2. **Component:** subclass `AfseValidatedTextField` (implement `afseRuleName`,
   `afseErrorKey`, `isAfseValid`, optionally `normalizeAfseValue`), give it a
   `builderInfo` with `group: 'afse'`, and register it in `afseComponents`.
   It is then picked up by the builder group automatically.
3. **Messages:** add the error key to `afseTranslations` (`en` and `el`).
4. **React helper:** add `fields.<name>` in `packages/afse-formio-react/src/schema/fields.ts`. Mobile gets it automatically.
5. **Tests:** cover the validator and component in `afse-formio-ext/test`, and
   the helper in `afse-formio-react/test`.

Inside forms, authors can also call the validators from custom validation
JavaScript: `valid = afse.iban(input) || 'Invalid IBAN'`.

Server-side validation: a Form.io server does not know the `afse*` types. If
forms are submitted to one, register the same components there, or keep the
domain checks in your own API with `validators`.

## Development

```bash
cd afse
npm install
npm run check        # build, typecheck, unit tests, boundary check
npm run e2e          # mobile form page end-to-end (Playwright, phone viewport)
npm run dev          # web playground on http://localhost:5173
npm run dev:mobile   # Expo dev server for the mobile playground
```

Unit tests run with Vitest + jsdom; `afse-formio-react` tests import the
extension from source, so both packages can change in one commit.

## Upgrading Form.io

The engine version is pinned in `packages/afse-formio-react/package.json` (and
as the peer/dev version in `afse-formio-ext`). To upgrade, bump `@formio/js`
and `@formio/react` together, run `npm run check`, and review
`src/internal/engine.ts`: it is the only place in the React library that
depends on engine behaviour.
