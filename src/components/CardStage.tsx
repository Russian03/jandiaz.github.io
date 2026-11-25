import { lazy, Suspense, useEffect, useState } from 'react';
import type { Content } from '../content/loadContent';
import { renderBack, renderFront, renderStrap } from '../cardFaces';

const Lanyard = lazy(() => import('./Lanyard/Lanyard'));

const PHOTO = '/profile.webp';

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function CardStage({
  content,
  size,
  strap,
}: {
  content: Content;
  size: number;
  strap: number;
}) {
  const [faces, setFaces] = useState<{ front: string; back: string; strap: string }>();
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    let alive = true;
    Promise.all([renderFront(content, PHOTO), renderBack(content), renderStrap(content)])
      .then(([front, back, strap]) => alive && setFaces({ front, back, strap }))
      .catch(() => alive && setFaces({ front: PHOTO, back: PHOTO, strap: PHOTO }));
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
        {faces && (
          <Lanyard
            frontImage={faces.front}
            backImage={faces.back}
            metal="graphite"
            strapImage={faces.strap}
            strapColor="#ffffff"
            cardColor="#ffffff"
            size={size}
            intro={false}
            strapLength={strap}
            breeze={0}
          />
        )}
      </Suspense>
    </div>
  );
}
