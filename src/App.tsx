import { useEffect, useState } from 'react';
import Markdown from 'react-markdown';
import { CONTENT, type Lang } from './content/loadContent';
import { readStoredLang, resolveInitialLang, storeLang } from './i18n/lang';
import { LangSwitch } from './components/LangSwitch';
import { ProfileLinks } from './components/ProfileLinks';
import { CardStage, hasWebGL } from './components/CardStage';

export default function App() {
  const [lang, setLang] = useState<Lang>(() =>
    resolveInitialLang(window.location.search, readStoredLang()),
  );
  const [aboutOpen, setAboutOpen] = useState(false);
  const [alwaysAbout] = useState(() => !hasWebGL());
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
      <main className="stage">
        <section
          className={`about${aboutOpen || alwaysAbout ? ' open' : ''}`}
          aria-label={content.aboutLabel}
        >
          <h2>{content.aboutLabel}</h2>
          <Markdown>{content.about}</Markdown>
        </section>
        <CardStage content={content} onFlip={setAboutOpen} />
      </main>

      <footer className="footer">
        <p className="hint">({content.hint})</p>
        <ProfileLinks links={content.links} />
        <LangSwitch lang={lang} onChange={setLang} />
      </footer>
    </div>
  );
}
