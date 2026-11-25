import { useEffect, useState } from 'react';

const NARROW = 600; // px: phone-sized windows get a bigger, slightly lower card

/** Card height as a fraction of the viewport, shrunk so the card also fits narrow windows. */
export function computeCardSize(w: number, h: number): number {
  const widthShare = w < NARROW ? 0.9 : 0.62;
  return Math.max(0.22, Math.min(0.46, (widthShare * w) / h));
}

/**
 * Where the card's top edge rests (fraction of viewport height). Keep in sync with the
 * `strapLength`: a longer strap on phone-sized windows hangs the card lower.
 */
export function computeCardTop(w: number): number {
  return w < NARROW ? 0.23 : 0.205;
}

export function computeStrapLength(w: number): number {
  return w < NARROW ? 0.4 : 0.32;
}

export function useCardLayout(): { size: number; top: number; strap: number } {
  const read = () => ({
    size: computeCardSize(window.innerWidth, window.innerHeight),
    top: computeCardTop(window.innerWidth),
    strap: computeStrapLength(window.innerWidth),
  });
  const [layout, setLayout] = useState(read);
  useEffect(() => {
    const update = () => setLayout(read());
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return layout;
}
