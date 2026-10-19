import { AfseForm, type AfseFormProps } from './AfseForm';
import type { AfseFormData } from 'afse-formio-react/schema';

export type AfseSubmissionViewProps<TData extends AfseFormData = AfseFormData> = Omit<
  AfseFormProps<TData>,
  'readOnly' | 'summary' | 'hideSubmitButton' | 'onSubmit' | 'onChange' | 'onValidationError' | 'data'
> & { data: TData };

/** Read-only text rendering of a submission, e.g. for a confirmation screen. */
export function AfseSubmissionView<TData extends AfseFormData = AfseFormData>(props: AfseSubmissionViewProps<TData>) {
  return <AfseForm<TData> {...props} readOnly summary hideSubmitButton />;
}
