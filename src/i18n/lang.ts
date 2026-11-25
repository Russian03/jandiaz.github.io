import { LANGS, type Lang } from '../content/loadContent';

const KEY = 'lang';

export const isLang = (value: unknown): value is Lang =>
  typeof value === 'string' && (LANGS as readonly string[]).includes(value);

/** English is the default. Override order: ?lang= → saved preference → 'en'. */
export function resolveInitialLang(search: string, stored: string | null): Lang {
  const fromQuery = new URLSearchParams(search).get('lang');
  if (isLang(fromQuery)) return fromQuery;
  if (isLang(stored)) return stored;
  return 'en';
}

export function readStoredLang(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function storeLang(lang: Lang): void {
  try {
    localStorage.setItem(KEY, lang);
  } catch {
    /* storage unavailable (private mode) – ignore */
  }
}
