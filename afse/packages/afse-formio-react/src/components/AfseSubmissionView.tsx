import type { CSSProperties } from 'react';
import { AfseForm } from './AfseForm';
import type { AfseFormData, AfseFormSource, AfseLanguage, AfseTranslations } from '../types';

export interface AfseSubmissionViewProps<TData extends AfseFormData = AfseFormData> {
  form: AfseFormSource;
  data: TData;
  language?: AfseLanguage;
  translations?: AfseTranslations;
  className?: string;
  style?: CSSProperties;
}

/** Read-only, text rendering of a submission, e.g. for review or confirmation screens. */
export function AfseSubmissionView<TData extends AfseFormData = AfseFormData>({
  className,
  ...props
}: AfseSubmissionViewProps<TData>) {
  return (
    <AfseForm<TData>
      {...props}
      className={['afse-submission-view', className].filter(Boolean).join(' ')}
      readOnly
      summary
      hideSubmitButton
    />
  );
}
