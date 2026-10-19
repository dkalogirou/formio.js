import type { AfseFieldJson, AfseFormDisplay, AfseFormJson } from '../types';

/** Settings shared by every input field. */
export interface FieldOptions {
  key: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  description?: string;
  tooltip?: string;
  defaultValue?: unknown;
  disabled?: boolean;
  hidden?: boolean;
  /** Shows the field only when another field has the given value. */
  showWhen?: { field: string; equals: string | number | boolean };
  /** Extra Form.io-compatible settings, for options not covered by these helpers. */
  extra?: Record<string, unknown>;
}

export interface TextOptions extends FieldOptions {
  minLength?: number;
  maxLength?: number;
  /** Regular expression the value must match. */
  pattern?: string;
}

export interface NumberOptions extends FieldOptions {
  min?: number;
  max?: number;
  decimals?: number;
}

export interface ChoiceOptions extends FieldOptions {
  options: ReadonlyArray<{ label: string; value: string }>;
}

export interface IbanOptions extends FieldOptions {
  /** ISO 3166 country codes the IBAN must belong to, e.g. `['GR', 'CY']`. */
  allowedCountries?: readonly string[];
}

export interface AmountOptions extends FieldOptions {
  min?: number;
  max?: number;
  /** ISO 4217 code, defaults to EUR. */
  currency?: string;
}

export interface DateOptions extends FieldOptions {
  /** Include a time picker. */
  withTime?: boolean;
  minDate?: string;
  maxDate?: string;
}

function input(type: string, options: FieldOptions, settings: Record<string, unknown> = {}, validate: Record<string, unknown> = {}): AfseFieldJson {
  const { key, label, required, placeholder, description, tooltip, defaultValue, disabled, hidden, showWhen, extra } = options;
  const json: Record<string, unknown> = {
    type,
    key,
    label,
    input: true,
    ...settings,
    validate: { ...(required ? { required: true } : {}), ...stripUndefined(validate) },
  };
  assign(json, { placeholder, description, tooltip, defaultValue, disabled, hidden });
  if (showWhen) {
    json.conditional = { show: true, when: showWhen.field, eq: String(showWhen.equals) };
  }
  return { ...json, ...extra } as AfseFieldJson;
}

function assign(target: Record<string, unknown>, values: Record<string, unknown>) {
  Object.assign(target, stripUndefined(values));
}

function stripUndefined(values: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function choices(options: ChoiceOptions['options']) {
  return options.map(({ label, value }) => ({ label, value }));
}

/** Typed builders for the fields available in AFSE forms. */
export const fields = {
  text: (o: TextOptions) => input('textfield', o, {}, { minLength: o.minLength, maxLength: o.maxLength, pattern: o.pattern }),
  textarea: (o: TextOptions & { rows?: number }) =>
    input('textarea', o, { rows: o.rows ?? 3 }, { minLength: o.minLength, maxLength: o.maxLength }),
  email: (o: FieldOptions) => input('email', o),
  phone: (o: FieldOptions) => input('phoneNumber', o, { inputMask: '' }),
  number: (o: NumberOptions) =>
    input('number', o, stripUndefined({ decimalLimit: o.decimals, requireDecimal: o.decimals !== undefined }), { min: o.min, max: o.max }),
  date: (o: DateOptions) =>
    input(
      'datetime',
      o,
      {
        enableTime: Boolean(o.withTime),
        format: o.withTime ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy',
        datePicker: stripUndefined({ minDate: o.minDate, maxDate: o.maxDate }),
      },
    ),
  select: (o: ChoiceOptions) => input('select', o, { dataSrc: 'values', data: { values: choices(o.options) } }),
  radio: (o: ChoiceOptions) => input('radio', o, { values: choices(o.options) }),
  checkbox: (o: FieldOptions) => input('checkbox', o),

  // AFSE domain fields (provided by the AFSE extension)
  iban: (o: IbanOptions) => input('afseIban', o, { allowedCountries: [...(o.allowedCountries ?? [])] }),
  taxId: (o: FieldOptions) => input('afseTaxId', o),
  amka: (o: FieldOptions) => input('afseAmka', o),
  amount: (o: AmountOptions) => input('afseAmount', o, { currency: o.currency ?? 'EUR' }, { min: o.min ?? 0, max: o.max }),

  /** Groups fields under a titled panel. */
  section: (o: { key: string; title: string; fields: readonly AfseFieldJson[]; collapsible?: boolean }): AfseFieldJson => ({
    type: 'panel',
    key: o.key,
    title: o.title,
    input: false,
    collapsible: Boolean(o.collapsible),
    components: [...o.fields],
  }),
  /** Repeating group of fields, e.g. a list of beneficiaries. */
  list: (o: { key: string; label: string; fields: readonly AfseFieldJson[]; addLabel?: string; minItems?: number }): AfseFieldJson => ({
    type: 'datagrid',
    key: o.key,
    label: o.label,
    input: true,
    addAnother: o.addLabel ?? 'Add',
    validate: stripUndefined({ minLength: o.minItems }),
    components: [...o.fields],
  }),
  /** Static HTML content. Only use trusted markup. */
  content: (o: { key: string; html: string }): AfseFieldJson => ({ type: 'htmlelement', key: o.key, tag: 'div', content: o.html, input: false }),
  submit: (o: { label?: string; key?: string } = {}): AfseFieldJson => ({
    type: 'button',
    action: 'submit',
    key: o.key ?? 'submit',
    label: o.label ?? 'Submit',
    theme: 'primary',
    input: true,
    disableOnInvalid: false,
  }),
  /** Button that fires `onCustomEvent(name, data)` on the form. */
  action: (o: { key: string; label: string; event: string }): AfseFieldJson => ({
    type: 'button',
    action: 'event',
    key: o.key,
    label: o.label,
    event: o.event,
    theme: 'secondary',
    input: true,
  }),
} as const;

export interface DefineFormOptions {
  title?: string;
  name?: string;
  fields: readonly AfseFieldJson[];
  /** Adds a submit button at the end unless one is already present. Default `true`. */
  submitButton?: boolean | string;
}

/** Builds a single-page form definition. */
export function defineForm({ title, name, fields: formFields, submitButton = true }: DefineFormOptions): AfseFormJson {
  const hasSubmit = formFields.some((field) => field.type === 'button' && field.action === 'submit');
  const components = [...formFields];
  if (submitButton && !hasSubmit) {
    components.push(fields.submit({ label: typeof submitButton === 'string' ? submitButton : undefined }));
  }
  return stripUndefined({ title, name, display: 'form' as AfseFormDisplay, components }) as unknown as AfseFormJson;
}

export interface DefineWizardOptions {
  title?: string;
  name?: string;
  steps: ReadonlyArray<{ key: string; title: string; fields: readonly AfseFieldJson[] }>;
}

/** Builds a multi-step (wizard) form definition; the last step submits. */
export function defineWizard({ title, name, steps }: DefineWizardOptions): AfseFormJson {
  return stripUndefined({
    title,
    name,
    display: 'wizard' as AfseFormDisplay,
    components: steps.map((step) => ({
      type: 'panel',
      key: step.key,
      title: step.title,
      input: false,
      components: [...step.fields],
    })),
  }) as unknown as AfseFormJson;
}
