import { describe, expect, it } from 'vitest';
import { CONTENT, LANGS, parseContent } from '../src/content/loadContent';
import { resolveInitialLang } from '../src/i18n/lang';

describe('content files', () => {
  it('parses every language with a non-empty about text', () => {
    for (const lang of LANGS) {
      expect(CONTENT[lang].name).toBeTruthy();
      expect(CONTENT[lang].about.length).toBeGreaterThan(20);
    }
  });

  it('keeps the same link types in every language', () => {
    const types = (l: (typeof LANGS)[number]) => CONTENT[l].links.map((x) => x.type);
    expect(types('es')).toEqual(types('en'));
  });

  it('rejects files without front matter', () => {
    expect(() => parseContent('just text')).toThrow();
  });
});

describe('resolveInitialLang', () => {
  it('defaults to English', () => expect(resolveInitialLang('', null)).toBe('en'));
  it('honours ?lang=', () => expect(resolveInitialLang('?lang=es', 'en')).toBe('es'));
  it('uses stored value and ignores junk', () => {
    expect(resolveInitialLang('', 'es')).toBe('es');
    expect(resolveInitialLang('?lang=xx', 'zz')).toBe('en');
  });
});
