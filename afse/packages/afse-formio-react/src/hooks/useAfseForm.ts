import { useRef } from 'react';
import type { AfseFormData, AfseFormHandle } from '../types';

/**
 * Convenience wrapper around a ref to `AfseForm`:
 *
 *   const form = useAfseForm<Payment>();
 *   <AfseForm ref={form.ref} ... />
 *   <button onClick={() => form.submit()}>Pay</button>
 */
export function useAfseForm<TData extends AfseFormData = AfseFormData>() {
  const ref = useRef<AfseFormHandle<TData>>(null);
  const handle = () => {
    if (!ref.current) {
      throw new Error('useAfseForm: the ref is not attached to a mounted AfseForm.');
    }
    return ref.current;
  };
  return {
    ref,
    submit: () => handle().submit(),
    validate: () => handle().validate(),
    getData: () => handle().getData(),
    setData: (data: Partial<TData>) => handle().setData(data),
    reset: () => handle().reset(),
    goToPage: (page: number) => handle().goToPage(page),
  };
}
