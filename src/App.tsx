import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { CONTENT, type Lang } from './content/loadContent';
import { readStoredLang, resolveInitialLang, storeLang } from './i18n/lang';
import { LangSwitch } from './components/LangSwitch';
import { ProfileLinks } from './components/ProfileLinks';
import { CardStage, hasWebGL } from './components/CardStage';
import { CARD_TOP, useCardSize } from './cardLayout';

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    resolveInitialLang(window.location.search, readStoredLang()),
  );
  const [alwaysAbout] = useState(() => !hasWebGL());
  const size = useCardSize();
  const content = CONTENT[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = content.title;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute('content', content.description);
    storeLang(lang);
  }, [lang, content]);

  return (
    <div className="page">
      <LangSwitch lang={lang} onChange={setLang} />
      <main className="stage">
        <section
          className={`about${alwaysAbout ? ' visible' : ''}`}
          aria-label={content.aboutLabel}
        >
          <h2>{content.aboutLabel}</h2>
          <Markdown>{content.about}</Markdown>
        </section>
        <CardStage content={content} size={size} />
      </main>

      <footer
        className={`footer${alwaysAbout ? ' flow' : ''}`}
        style={alwaysAbout ? undefined : { top: `${(CARD_TOP + size) * 100}vh` }}
      >
        <p className="hint">({content.hint})</p>
        <ProfileLinks links={content.links} />
      </footer>
    </div>
  );
}
