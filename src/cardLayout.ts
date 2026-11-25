import { useEffect, useState } from 'react';

/** Card height as a fraction of the viewport, shrunk so the card also fits narrow windows. */
export function computeCardSize(w: number, h: number): number {
  return Math.max(0.22, Math.min(0.46, (0.62 * w) / h));
}

/** Where the card's top edge rests (fraction of viewport height) with the current strap. */
export const CARD_TOP = 0.205;

export function useCardSize(): number {
  const [size, setSize] = useState(() => computeCardSize(window.innerWidth, window.innerHeight));
  useEffect(() => {
    const update = () => setSize(computeCardSize(window.innerWidth, window.innerHeight));
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}
