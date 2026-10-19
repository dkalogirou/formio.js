/**
 * Public types of the AFSE form library. They are deliberately independent
 * of the rendering engine so that it can change without breaking consumers.
 */

/** Any JSON-serialisable value stored in a submission. */
export type AfseJson = string | number | boolean | null | AfseJson[] | { [key: string]: AfseJson };

export type AfseFormData = Record<string, unknown>;

/** Languages that ship with translations. Any other code works with custom `translations`. */
export type AfseLanguage = 'en' | 'el' | (string & {});

/** `{ [language]: { [messageKey]: text } }` */
export type AfseTranslations = Record<string, Record<string, string>>;

/** A single field definition, as produced by the `fields` helpers or the form builder. */
export interface AfseFieldJson {
  readonly type: string;
  readonly key?: string;
  readonly [setting: string]: unknown;
}

/**
 * A serialisable form definition. Produce one with `defineForm`, get one from
 * `AfseFormBuilder`'s `onChange`, or load one from your backend; treat it as
 * opaque data that is stored and passed back unchanged.
 */
export interface AfseFormJson {
  readonly title?: string;
  readonly name?: string;
  readonly display?: AfseFormDisplay;
  readonly components: readonly AfseFieldJson[];
  readonly [setting: string]: unknown;
}

export type AfseFormDisplay = 'form' | 'wizard';

/** Either an inline definition or the URL of a form served by a Form.io-compatible API. */
export type AfseFormSource = AfseFormJson | string;

export interface AfseSubmission<TData extends AfseFormData = AfseFormData> {
  data: TData;
  /** Server-assigned id when the form was loaded from (and saved to) an API. */
  id?: string;
  state?: 'submitted' | 'draft' | (string & {});
}

export interface AfseValidationError {
  /** Data path of the field, e.g. `beneficiary.iban` or `items[2].amount`. */
  path: string;
  /** Field label as shown to the user. */
  label?: string;
  /** Translated, user-facing message. */
  message: string;
  /** Rule that failed, e.g. `required` or `afseIban`. */
  rule?: string;
}

export interface AfseChange<TData extends AfseFormData = AfseFormData> {
  data: TData;
  /** Path of the field that triggered the change, when known. */
  changedPath?: string;
  /** Whether the change came from the user rather than from code. */
  modifiedByUser: boolean;
}

/** Imperative handle exposed through `ref` on `AfseForm`. */
export interface AfseFormHandle<TData extends AfseFormData = AfseFormData> {
  /** Validates and submits. Rejects with the validation errors when the form is invalid. */
  submit(): Promise<AfseSubmission<TData>>;
  /** Validates every field, shows the errors and returns them (empty when valid). */
  validate(): AfseValidationError[];
  getData(): TData;
  setData(data: Partial<TData>): Promise<void>;
  /** Clears the form back to its default values. */
  reset(): void;
  /** Moves a wizard to the given zero-based page. No-op for single-page forms. */
  goToPage(page: number): Promise<void>;
}
