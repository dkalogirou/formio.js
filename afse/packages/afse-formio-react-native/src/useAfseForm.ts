import { useRef } from 'react';
import type { AfseFormData } from 'afse-formio-react/schema';
import type { AfseMobileFormHandle } from './AfseForm';

/**
 *   const form = useAfseForm<Payment>();
 *   <AfseForm ref={form.ref} form={payment} />
 *   <Button title="Pay" onPress={() => form.submit().then(save)} />
 */
export function useAfseForm<TData extends AfseFormData = AfseFormData>() {
  const ref = useRef<AfseMobileFormHandle<TData>>(null);
  const run = <R>(call: (handle: AfseMobileFormHandle<TData>) => Promise<R>): Promise<R> =>
    ref.current
      ? call(ref.current)
      : Promise.reject(new Error('useAfseForm: the ref is not attached to a mounted AfseForm.'));
  return {
    ref,
    submit: () => run((h) => h.submit()),
    validate: () => run((h) => h.validate()),
    getData: () => run((h) => h.getData()),
    setData: (data: Partial<TData>) => run((h) => h.setData(data)),
    reset: () => run((h) => h.reset()),
    goToPage: (page: number) => run((h) => h.goToPage(page)),
  };
}
