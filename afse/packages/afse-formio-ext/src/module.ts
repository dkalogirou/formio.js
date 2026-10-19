import { Formio } from '@formio/js';
import { afseComponents } from './components';
import { afseTranslations } from './i18n';

/**
 * The AFSE extension as a Form.io module, usable with `Formio.use(...)`.
 */
export const AfseFormioModule = {
  components: afseComponents,
  translations: afseTranslations,
};

const INSTALLED = Symbol.for('afse-formio-ext.installed');

type FormioLike = { use: (module: unknown) => void } & Record<symbol, unknown>;

/**
 * Registers the AFSE extension with the Form.io renderer. Safe to call more
 * than once; only the first call per Formio instance has an effect.
 */
export function installAfseExtension(formio: FormioLike = Formio as unknown as FormioLike): void {
  if (formio[INSTALLED]) {
    return;
  }
  formio.use(AfseFormioModule);
  formio[INSTALLED] = true;
}
