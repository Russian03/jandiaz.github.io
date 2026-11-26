import type { Content } from './content/loadContent';

const W = 900;
const H = 1260;
const FONT = '"Bricolage Grotesque Variable", system-ui, sans-serif';

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('700 96px "Bricolage Grotesque Variable"'),
      document.fonts.load('400 42px "Bricolage Grotesque Variable"'),
      document.fonts.load('500 44px "Bricolage Grotesque Variable"'),
    ]);
  } catch {
    /* fall back to system font */
  }
}

function drawSlot(ctx: CanvasRenderingContext2D, light = false) {
  ctx.beginPath();
  ctx.roundRect(W / 2 - 85, 70, 170, 36, 18);
  ctx.fillStyle = light ? '#d3d6db' : '#08090b';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = light ? '#b4b9c1' : '#3a3f48';
  ctx.stroke();
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

/** Front face: white card with the name on top, the photo in the middle and the position below. */
export async function renderFront(c: Content, photoUrl: string): Promise<string> {
  await loadFonts();
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#ffffff');
  bg.addColorStop(1, '#e8eaed');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawSlot(ctx, true);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#14161a';
  fitText(ctx, c.name, W - 160, 110, 700);
  ctx.fillText(c.name, W / 2, 255);

  const img = await loadImage(photoUrl);
  const pw = 560,
    ph = 640;
  const px = (W - pw) / 2,
    py = 320;
  ctx.save();
  ctx.beginPath();
  ctx.rect(px, py, pw, ph);
  ctx.clip();
  const scale = Math.max(pw / img.width, ph / img.height);
  const dw = img.width * scale,
    dh = img.height * scale;
  ctx.drawImage(img, px + (pw - dw) / 2, py + (ph - dh) * 0.2, dw, dh);
  ctx.restore();

  ctx.fillStyle = '#14161a';
  ctx.font = `700 64px ${FONT}`;
  const lines = wrap(ctx, c.position, W - 160);
  const lh = 76;
  const y0 = 1040 + (2 - Math.min(lines.length, 2)) * (lh / 2);
  lines.slice(0, 3).forEach((l, n) => ctx.fillText(l, W / 2, y0 + n * lh));
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

/** Back face: "About me" text on a graphite background. */
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

  const pad = 70;
  const text = c.about.replace(/[*_`#>]/g, '');
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f4f5f7';
  ctx.font = `700 64px ${FONT}`;
  ctx.fillText(c.aboutLabel, pad, 260);

  // shrink the body text until it fits the free area
  const top = 320;
  const bottom = H - 90;
  let size = 56;
  let lines: string[] = [];
  for (; size >= 22; size -= 2) {
    ctx.font = `400 ${size}px ${FONT}`;
    lines = wrap(ctx, text, W - pad * 2);
    if (lines.length * size * 1.35 <= bottom - top) break;
  }
  ctx.fillStyle = '#c9ced6';
  lines.forEach((l, n) => ctx.fillText(l, pad, top + size + n * size * 1.35));

  return canvas.toDataURL('image/png');
}

/**
 * Lanyard strap tile: the name once, followed by some plain strap. The tile repeats along
 * the whole strap, so the name shows up several times with comfortable spacing.
 * Widen `w` for more space between names, shrink it for denser repetition (keep the
 * name narrower than `w` so neighbours never touch).
 */
export async function renderStrap(c: Content): Promise<string> {
  await loadFonts();
  const w = 430;
  const h = 200;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#101216';
  ctx.fillRect(0, 0, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8eaee';
  ctx.font = `700 62px ${FONT}`;
  ctx.fillText(c.name.toUpperCase(), w / 2, h / 2);
  return canvas.toDataURL('image/png');
}
