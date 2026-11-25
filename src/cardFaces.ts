import type { Content } from './content/loadContent';

const W = 900;
const H = 1260;
const FONT = '"Space Grotesk Variable", system-ui, sans-serif';

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('700 96px "Space Grotesk Variable"'),
      document.fonts.load('400 42px "Space Grotesk Variable"'),
      document.fonts.load('500 44px "Space Grotesk Variable"'),
    ]);
  } catch {
    /* fall back to system font */
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  size: number,
  weight: number,
) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${FONT}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 20);
}

/** Front face: portrait photo, name and position on a graphite card. */
export async function renderFront(c: Content, photoUrl: string): Promise<string> {
  await loadFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#2b2f36');
  bg.addColorStop(1, '#14161a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const img = await loadImage(photoUrl);
  const px = 90,
    py = 170,
    pw = W - 180,
    ph = 700;
  const r = 36;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, r);
  ctx.clip();
  const scale = Math.max(pw / img.width, ph / img.height);
  const dw = img.width * scale,
    dh = img.height * scale;
  ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) * 0.2, dw, dh);
  ctx.restore();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f5f7';
  fitText(ctx, c.name, W - 180, 96, 700);
  ctx.fillText(c.name, W / 2, 985);
  ctx.fillStyle = '#a9afb9';
  fitText(ctx, c.position, W - 180, 44, 500);
  ctx.fillText(c.position, W / 2, 1060);
  ctx.fillStyle = '#5b6270';
  ctx.fillRect(W / 2 - 40, 1110, 80, 4);
  return canvas.toDataURL('image/png');
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split(/\n+/)) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) {
        lines.push(line);
        line = word;
      } else line = test;
    }
    if (line) lines.push(line);
    lines.push('');
  }
  lines.pop();
  return lines;
}

/** Back face: "About me" text plus the Instagram handle on a graphite background. */
export async function renderBack(c: Content): Promise<string> {
  await loadFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(W, 0, 0, H);
  bg.addColorStop(0, '#2b2f36');
  bg.addColorStop(1, '#14161a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const pad = 90;
  const text = c.about.replace(/[*_`#>]/g, '');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f4f5f7';
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText(c.aboutLabel, pad, 330);

  // shrink the body text until it fits the free area
  const top = 400;
  const bottom = H - 190;
  let size = 42;
  let lines: string[] = [];
  for (; size >= 22; size -= 2) {
    ctx.font = `400 ${size}px ${FONT}`;
    lines = wrap(ctx, text, W - pad * 2);
    if (lines.length * size * 1.4 <= bottom - top) break;
  }
  ctx.fillStyle = '#c9ced6';
  lines.forEach((l, n) => ctx.fillText(l, pad, top + size + n * size * 1.4));

  ctx.textAlign = 'center';
  ctx.fillStyle = '#a9afb9';
  fitText(ctx, c.handle, W - 180, 44, 500);
  ctx.fillText(c.handle, W / 2, H - 110);
  return canvas.toDataURL('image/png');
}

/** Repeating lanyard strap tile (same 1025x250 format ReactBits expects). */
export async function renderStrap(c: Content): Promise<string> {
  await loadFonts();
  const canvas = document.createElement('canvas');
  canvas.width = 1025;
  canvas.height = 250;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#101216';
  ctx.fillRect(0, 0, 1025, 250);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8eaee';
  ctx.font = `700 96px ${FONT}`;
  ctx.fillText(c.name.toUpperCase(), 1025 / 2, 125);
  return canvas.toDataURL('image/png');
}
