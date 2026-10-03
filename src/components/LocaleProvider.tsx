'use client';

import { createContext } from 'react';
import { t } from '@/lib/i18n';

/**
 * Context carrying the app's translation function. The dictionary itself
 * lives in `src/lib/i18n.ts` and is resolved once at module load (locale is
 * fixed per running instance, not switchable at runtime) — this context
 * just makes that same `t` reachable via a hook from Client Components,
 * which can't import server-only modules or use plain functions tied to
 * request context the way Server Components can.
 */
export const LocaleContext = createContext(t);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  return <LocaleContext.Provider value={t}>{children}</LocaleContext.Provider>;
}
