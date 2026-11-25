import type { Content } from './content/loadContent';

const W = 900;
const H = 1260;

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('700 96px "Space Grotesk Variable"'),
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
    ctx.font = `${weight} ${s}px "Space Grotesk Variable", system-ui, sans-serif`;
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

/** Back face: handle on a plain graphite background. */
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
  ctx.textAlign = 'center';
  ctx.fillStyle = '#f4f5f7';
  fitText(ctx, c.name, W - 180, 84, 700);
  ctx.fillText(c.name, W / 2, H / 2 - 20);
  ctx.fillStyle = '#a9afb9';
  fitText(ctx, c.handle, W - 180, 52, 500);
  ctx.fillText(c.handle, W / 2, H / 2 + 60);
  return canvas.toDataURL('image/png');
}
