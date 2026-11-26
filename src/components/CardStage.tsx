import { lazy, Suspense, useEffect, useState } from 'react';
import type { Content } from '../content/loadContent';
import { renderBack, renderFront, renderStrap } from '../cardFaces';

const Lanyard = lazy(() => import('./Lanyard/Lanyard'));

const PHOTO = `${import.meta.env.BASE_URL}profile.webp`;

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

  // The canvas sits above everything (the card must never be hidden), so links and
  // buttons under it are reached by letting the pointer through while hovering them.
  useEffect(() => {
    if (!webgl) return;
    const canvas = document.querySelector<HTMLElement>('.canvas');
    const control = (x: number, y: number) =>
      document
        .elementsFromPoint(x, y)
        .find((el) => !canvas?.contains(el) && el.closest('a, button'))
        ?.closest<HTMLElement>('a, button');
    const onMove = (e: PointerEvent) => {
      if (canvas) canvas.style.pointerEvents = control(e.clientX, e.clientY) ? 'none' : '';
    };
    // touch has no hover: forward a real tap on a control that the canvas swallowed.
    // A drag (moved or held) that happens to end over a control must not open it.
    let down: { x: number; y: number; t: number } | null = null;
    const onDown = (e: PointerEvent) => {
      down = canvas?.contains(e.target as Node)
        ? { x: e.clientX, y: e.clientY, t: e.timeStamp }
        : null;
    };
    const onUp = (e: PointerEvent) => {
      const start = down;
      down = null;
      if (e.pointerType === 'mouse' || !start) return;
      const moved = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (moved > 10 || e.timeStamp - start.t > 400) return;
      control(e.clientX, e.clientY)?.click();
    };
    const onCancel = () => {
      down = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [webgl]);

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
