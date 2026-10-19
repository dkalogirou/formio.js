import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  type CSSProperties,
  type ForwardedRef,
  type ReactElement,
  type Ref,
} from 'react';
import {
  EngineForm,
  ensureEngine,
  mergeTranslations,
  rendererOptions,
  toValidationErrors,
  type EngineError,
  type EngineFormInstance,
} from '../internal/engine';
import { useAfseConfig } from './AfseProvider';
import type {
  AfseChange,
  AfseFormData,
  AfseFormHandle,
  AfseFormSource,
  AfseLanguage,
  AfseSubmission,
  AfseTranslations,
  AfseValidationError,
} from '../types';

export interface AfseFormProps<TData extends AfseFormData = AfseFormData> {
  /** The form definition, or the URL of a form served by the forms API. */
  form: AfseFormSource;
  /** Values to show in the form. Updating it replaces the form's data. */
  data?: Partial<TData>;
  /** Overrides the provider's language. */
  language?: AfseLanguage;
  /** Per-form translation overrides, layered over the provider's. */
  translations?: AfseTranslations;
  /** Renders inputs disabled. */
  readOnly?: boolean;
  /** Renders values as text instead of inputs (for review/summary screens). */
  summary?: boolean;
  /** Hides submit buttons, e.g. when submitting through the `ref` handle. */
  hideSubmitButton?: boolean;
  className?: string;
  style?: CSSProperties;
  onSubmit?: (submission: AfseSubmission<TData>) => void;
  onChange?: (change: AfseChange<TData>) => void;
  /** Called with the errors when a submit attempt fails validation. */
  onValidationError?: (errors: AfseValidationError[]) => void;
  /** Wizard forms: called with the zero-based page after navigation. */
  onPageChange?: (page: number) => void;
  /** Called when a button configured with the "event" action is clicked. */
  onCustomEvent?: (name: string, data: TData) => void;
  onReady?: () => void;
}

type EngineSubmission = EngineFormInstance['submission'];

function toSubmission<TData extends AfseFormData>(submission: EngineSubmission): AfseSubmission<TData> {
  return { data: submission.data as TData, id: submission._id, state: submission.state };
}

function pageOf(event: unknown): number | undefined {
  if (typeof event === 'number') {
    return event;
  }
  return (event as { page?: number } | undefined)?.page;
}

function AfseFormInner<TData extends AfseFormData = AfseFormData>(
  props: AfseFormProps<TData>,
  ref: ForwardedRef<AfseFormHandle<TData>>,
) {
  ensureEngine();
  const config = useAfseConfig();
  const {
    form,
    data,
    language = config.language,
    readOnly = false,
    summary = false,
    hideSubmitButton = false,
    className,
    style,
  } = props;

  const instanceRef = useRef<EngineFormInstance | null>(null);
  const appliedData = useRef<string | undefined>(undefined);
  const latest = useRef(props);
  latest.current = props;

  const translations = useMemo(
    () => mergeTranslations(config.translations, props.translations),
    [config.translations, props.translations],
  );
  const translationsKey = useMemo(() => JSON.stringify(translations), [translations]);

  // The renderer reads these options only when it builds the form; changing
  // any of them remounts it (see `key` below). Language is applied in place.
  const initialLanguage = useRef(language);
  const options = useMemo(
    () => rendererOptions({ language: initialLanguage.current, translations, readOnly, summary, hideSubmitButton }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [translationsKey, readOnly, summary, hideSubmitButton],
  );
  const engineKey = `${readOnly}|${summary}|${hideSubmitButton}|${translationsKey}`;

  const applyData = useCallback((instance: EngineFormInstance, next: Partial<TData> | undefined) => {
    const serialized = next === undefined ? undefined : JSON.stringify(next);
    if (serialized === undefined || serialized === appliedData.current) {
      return Promise.resolve();
    }
    appliedData.current = serialized;
    return instance.setSubmission({ data: { ...next } }).then(() => undefined);
  }, []);

  const handleReady = useCallback(
    (instance: unknown) => {
      const engine = instance as EngineFormInstance;
      instanceRef.current = engine;
      appliedData.current = undefined;
      if (engine.language !== latest.current.language && latest.current.language) {
        engine.language = latest.current.language;
      }
      applyData(engine, latest.current.data).then(() => latest.current.onReady?.());
    },
    [applyData],
  );

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance) {
      applyData(instance, data);
    }
  }, [data, applyData]);

  useEffect(() => {
    const instance = instanceRef.current;
    if (instance && instance.language !== language) {
      instance.language = language;
    }
  }, [language]);

  const requireInstance = () => {
    if (!instanceRef.current) {
      throw new Error('AfseForm is not ready yet. Wait for onReady before using the form handle.');
    }
    return instanceRef.current;
  };

  useImperativeHandle(
    ref,
    (): AfseFormHandle<TData> => ({
      async submit() {
        const instance = requireInstance();
        try {
          return toSubmission<TData>(await instance.submit());
        } catch (error) {
          throw Array.isArray(error) ? toValidationErrors(error as EngineError[]) : error;
        }
      },
      validate() {
        const instance = requireInstance();
        instance.setPristine(false);
        instance.checkValidity(null, true);
        const errors = instance.errors;
        instance.showErrors(errors);
        return toValidationErrors(errors);
      },
      getData() {
        return requireInstance().submission.data as TData;
      },
      async setData(next) {
        const instance = requireInstance();
        await instance.setSubmission({ data: { ...instance.submission.data, ...next } });
      },
      reset() {
        const instance = requireInstance();
        instance.resetValue();
        instance.setPristine(true);
      },
      async goToPage(page) {
        await requireInstance().setPage?.(page);
      },
    }),
    [],
  );

  return (
    <div className={['afse-form', className].filter(Boolean).join(' ')} style={style}>
      <EngineForm
        key={engineKey}
        src={form as never}
        options={options as never}
        onFormReady={handleReady}
        onSubmit={(submission) => latest.current.onSubmit?.(toSubmission<TData>(submission as EngineSubmission))}
        onChange={(value, flags, modified) =>
          latest.current.onChange?.({
            data: (value as EngineSubmission).data as TData,
            changedPath: flags?.changed?.instance?.path ?? flags?.changed?.component?.key,
            modifiedByUser: Boolean(modified),
          })
        }
        onSubmitError={(errors) => {
          if (Array.isArray(errors)) {
            latest.current.onValidationError?.(toValidationErrors(errors as EngineError[]));
          }
        }}
        onNextPage={(event) => {
          const page = pageOf(event);
          if (page !== undefined) latest.current.onPageChange?.(page);
        }}
        onPrevPage={(event) => {
          const page = pageOf(event);
          if (page !== undefined) latest.current.onPageChange?.(page);
        }}
        onCustomEvent={(event) => latest.current.onCustomEvent?.(event.type, event.data as TData)}
      />
    </div>
  );
}

/**
 * Renders a form definition (or a form loaded by URL) with the AFSE
 * components available. Use a `ref` for imperative submit/validate.
 */
export const AfseForm = forwardRef(AfseFormInner) as <TData extends AfseFormData = AfseFormData>(
  props: AfseFormProps<TData> & { ref?: Ref<AfseFormHandle<TData>> },
) => ReactElement;
