import { lazy, Suspense, useEffect, useState } from 'react';
import type { Content } from '../content/loadContent';
import { renderBack, renderFront } from '../cardFaces';

const Badge = lazy(() => import('./Badge/Badge'));

const PHOTO = '/profile.webp';

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

export function CardStage({ content }: { content: Content }) {
  const [faces, setFaces] = useState<{ front: string; back: string }>();
  const [webgl] = useState(hasWebGL);

  useEffect(() => {
    let alive = true;
    Promise.all([renderFront(content, PHOTO), renderBack(content)])
      .then(([front, back]) => alive && setFaces({ front, back }))
      .catch(() => alive && setFaces({ front: PHOTO, back: PHOTO }));
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
        {faces && <Badge front={faces.front} back={faces.back} />}
      </Suspense>
    </div>
  );
}
