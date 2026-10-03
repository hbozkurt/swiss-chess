import en from '@locales/en.json';
import tr from '@locales/tr.json';

const dictionaries = { en, tr } satisfies Record<string, Record<string, string>>;

export type Locale = keyof typeof dictionaries;

/**
 * The active locale, fixed for the lifetime of the running app — set via
 * `NEXT_PUBLIC_LOCALE` (so it's inlined into the client bundle, not just
 * readable on the server) and defaulting to English. Not meant to change
 * at runtime; switch it by editing `.env.local` and restarting.
 */
export const locale: Locale = process.env.NEXT_PUBLIC_LOCALE === 'tr' ? 'tr' : 'en';

const dictionary: Record<string, string> = dictionaries[locale];

/**
 * Looks up `key` in the active locale's dictionary and returns its text,
 * interpolating any `{name}` placeholders from `vars`. Falls back to the
 * key itself (instead of throwing) if it's missing, so a translation gap
 * shows up as an obviously-wrong label rather than a crashed page.
 *
 * Used directly by Server Components, server actions, and the PDF export
 * documents, none of which can use React context. Client Components should
 * prefer the `useLocale()` hook, which returns this same function.
 */
export function t(key: string, vars?: Record<string, string | number>): string {
  let text = dictionary[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replaceAll(`{${name}}`, String(value));
    }
  }
  return text;
}
