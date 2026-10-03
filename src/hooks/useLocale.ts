'use client';

import { useContext } from 'react';
import { LocaleContext } from '@/components/LocaleProvider';

/**
 * Returns the translation function: `t('some.key')`, or `t('some.key', { count: 3 })`
 * for keys with `{placeholder}` interpolation. For use in Client Components only —
 * Server Components and server actions should import `t` directly from `@/lib/i18n`.
 */
export function useLocale() {
  return useContext(LocaleContext);
}
