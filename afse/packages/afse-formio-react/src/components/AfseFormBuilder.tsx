import { useMemo, useRef, type CSSProperties } from 'react';
import {
  EngineFormBuilder,
  builderOptions,
  ensureEngine,
  mergeTranslations,
  type StandardBuilderGroup,
} from '../internal/engine';
import { useAfseConfig } from './AfseProvider';
import type { AfseFormJson, AfseLanguage, AfseTranslations } from '../types';

export type AfseBuilderGroup = StandardBuilderGroup;

export interface AfseFormBuilderProps {
  /** Form to start editing from. Changing it afterwards reloads the builder. */
  initialForm?: AfseFormJson;
  /** Called with the full, serialisable definition after every edit. */
  onChange?: (form: AfseFormJson) => void;
  /**
   * Standard component groups shown next to the AFSE group.
   * Defaults to `['basic', 'advanced', 'layout', 'data']`.
   */
  standardGroups?: readonly AfseBuilderGroup[];
  language?: AfseLanguage;
  translations?: AfseTranslations;
  className?: string;
  style?: CSSProperties;
}

const DEFAULT_GROUPS: readonly AfseBuilderGroup[] = ['basic', 'advanced', 'layout', 'data'];
const EMPTY_FORM: AfseFormJson = { display: 'form', components: [] };

/**
 * Drag-and-drop form builder with the AFSE components in their own group.
 * Its output can be stored and rendered later with `AfseForm`.
 */
export function AfseFormBuilder({
  initialForm = EMPTY_FORM,
  onChange,
  standardGroups = DEFAULT_GROUPS,
  language,
  translations,
  className,
  style,
}: AfseFormBuilderProps) {
  ensureEngine();
  const config = useAfseConfig();
  const effectiveLanguage = language ?? config.language;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const groupsKey = standardGroups.join(',');
  const options = useMemo(
    () =>
      builderOptions({
        language: effectiveLanguage,
        translations: mergeTranslations(config.translations, translations),
        standardGroups,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [effectiveLanguage, config.translations, translations, groupsKey],
  );
  // The builder mutates the definition it is given; hand it a private copy.
  const startingForm = useMemo(() => structuredClone(initialForm) as never, [initialForm]);

  return (
    <div className={['afse-form-builder', className].filter(Boolean).join(' ')} style={style}>
      <EngineFormBuilder
        initialForm={startingForm}
        options={options as never}
        onChange={(form) => onChangeRef.current?.(form as unknown as AfseFormJson)}
      />
    </div>
  );
}
