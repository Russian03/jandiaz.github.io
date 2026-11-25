import { LANGS, type Lang } from '../content/loadContent';

const NAMES: Record<Lang, string> = { en: 'English', es: 'Español' };

interface Props {
  lang: Lang;
  onChange: (lang: Lang) => void;
}

export function LangSwitch({ lang, onChange }: Props) {
  return (
    <div className="lang" role="group" aria-label="Language">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={l === lang}
          className={l === lang ? 'active' : ''}
          onClick={() => onChange(l)}
        >
          {NAMES[l]}
        </button>
      ))}
    </div>
  );
}
