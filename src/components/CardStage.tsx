import { lazy, Suspense, useEffect, useState } from 'react';
import type { Content } from '../content/loadContent';
import { renderBack, renderFront } from '../cardFaces';

const Lanyard = lazy(() => import('./Lanyard/Lanyard'));

const PHOTO = '/profile.webp';

function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function CardStage({ content }: { content: Content }) {
  const [front, setFront] = useState<string>();
  const [webgl] = useState(hasWebGL);
  const [calm] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const back = renderBackMemo(content);

  useEffect(() => {
    let alive = true;
    renderFront(content, PHOTO)
      .then((url) => alive && setFront(url))
      .catch(() => alive && setFront(PHOTO));
    return () => {
      alive = false;
    };
  }, [content]);

  if (!webgl) {
    return (
      <figure className="static-card">
        <img src={PHOTO} alt={content.name} width={300} height={400} />
        <figcaption>
          <strong>{content.name}</strong>
          <span>{content.position}</span>
        </figcaption>
      </figure>
    );
  }

  return (
    <div className="canvas" role="img" aria-label={`${content.name} — ${content.position}`}>
      <Suspense fallback={null}>
        {front && (
          <Lanyard
            frontImage={front}
            backImage={back}
            metal="graphite"
            cardColor="#1c1f25"
            size={0.62}
            intro={!calm}
            breeze={calm ? 0 : 0.5}
          />
        )}
      </Suspense>
    </div>
  );
}

const cache = new Map<Content, string>();
function renderBackMemo(c: Content): string {
  let v = cache.get(c);
  if (!v) cache.set(c, (v = renderBack(c)));
  return v;
}
