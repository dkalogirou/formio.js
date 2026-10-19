# afse-formio-react-native

AFSE forms in your React Native / Expo app. It shows the **same forms** as the
web (IBAN, ΑΦΜ, ΑΜΚΑ, amounts, wizards, Greek/English, the same validation) in
one component. No Form.io knowledge needed.

## Quick start (3 steps)

**1. Install**

```bash
npx expo install afse-formio-react-native react-native-webview
```

(Bare React Native: `npm install afse-formio-react-native react-native-webview && npx pod-install`.)

**2. Describe your form**

```ts
import { defineForm, fields } from 'afse-formio-react-native';

export const payment = defineForm({
  fields: [
    fields.text({ key: 'beneficiary', label: 'Beneficiary', required: true }),
    fields.iban({ key: 'iban', label: 'IBAN', required: true }),
    fields.amount({ key: 'amount', label: 'Amount', required: true }),
  ],
  submitButton: 'Pay',
});
```

Or use a form made in the web `AfseFormBuilder` / loaded from your API: it is the same JSON.

**3. Show it**

```tsx
import { AfseForm } from 'afse-formio-react-native';

export function PaymentScreen() {
  return <AfseForm form={payment} onSubmit={({ data }) => api.pay(data)} />;
}
```

That's it. The form checks every field (IBAN checksum, ΑΦΜ, required, …),
shows the errors, and calls `onSubmit` only with valid data.

## Common recipes

| I want to… | Do this |
| --- | --- |
| Show it in Greek | `<AfseForm language="el" …/>` or wrap the app in `<AfseProvider language="el">` |
| Rename a label | `translations={{ el: { Beneficiary: 'Δικαιούχος' } }}` |
| Use our colours | `theme={{ primaryColor: '#0b3d91', radius: 8, fontFamily: 'Inter' }}` |
| Pre-fill values | `data={{ beneficiary: 'ACME' }}` |
| Use my own native button | `hideSubmitButton` + `const form = useAfseForm(); <AfseForm ref={form.ref} …/>` then `form.submit()` |
| Know what is wrong | `onValidationError={(errors) => …}`. Each error has `path`, `label`, `message`. |
| Put the form inside a ScrollView | `autoHeight`: the form grows to its content instead of scrolling itself |
| Show a read-only summary | `<AfseSubmissionView form={payment} data={submitted} />` |
| Multi-step form | `defineWizard({ steps: [...] })`, plus `onPageChange` and `form.goToPage(n)` |
| Load a form from the forms API | `<AfseProvider baseUrl="https://forms.example.com">` + `form="https://forms.example.com/payment"` |
| Check an IBAN without a form | `validators.iban('GR16 0110 …')` |

Everything on `useAfseForm()` / the `ref` returns a promise: `submit()`,
`validate()`, `getData()`, `setData(values)`, `reset()`, `goToPage(n)`.
`submit()` rejects with the list of errors when the form is not valid.

## How it works

The form runs in a WebView using a page bundled inside this package (scripts,
styles and fonts inlined). It needs no web server, no network access and no
native code beyond `react-native-webview`, so it works in Expo Go. Your
app and the page talk through a small message protocol (`src/protocol.ts`).
The page is built with the web library `afse-formio-react`, so web and mobile
cannot drift apart.

Trade-offs: inputs are web inputs (styled for touch: 16px text, 44px targets),
not native widgets; the library adds about 2.8 MB to your JS bundle; the form
builder is web-only.

## Testing

* `npm test`: unit tests of the native component (message handling, the handle, config updates).
* `npm run e2e`: Playwright drives the real form page on a phone-sized touch
  viewport and plays the native side of the bridge: typing, tapping, validation,
  submit, Greek, theming, wizards.
* `apps/mobile-playground/.maestro`: on-device flows for the demo app
  ([Maestro](https://maestro.mobile.dev)): `npm run android && npm run e2e:device`.

Tap the form's fields in your own Maestro/Detox tests by their labels, as in those flows.
