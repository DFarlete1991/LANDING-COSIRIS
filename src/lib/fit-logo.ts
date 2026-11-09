// Ajusta en el navegador un logo del directorio para mostrarlo dentro de un
// círculo: recorta el margen vacío, quita un marco fino si lo hay y rellena el
// cuadrado con el color de fondo del propio logo. Es la misma lógica que
// scripts/logos-circulo.mjs aplica a los logos locales (si cambias una, cambia
// la otra).
//
// Solo funciona con imágenes servidas con CORS (el almacenamiento de Supabase
// lo permite). Si el servidor no lo permite, devuelve null y el logo se pinta
// tal cual. Cada logo se procesa una vez por visita.

import { useEffect, useState } from 'react';

const SIZE = 192;
const DIAGONAL = 0.88;
const SAMPLE = 200;

type RGBA = [number, number, number, number];
const near = (a: RGBA | number[], b: RGBA | number[], t: number) =>
  Math.abs(a[0] - b[0]) <= t && Math.abs(a[1] - b[1]) <= t && Math.abs(a[2] - b[2]) <= t;
const avg = (cs: RGBA[]) => [0, 1, 2].map((k) => Math.round(cs.reduce((s, c) => s + c[k], 0) / cs.length));

const cache = new Map<string, Promise<string | null>>();

// Solo se intenta con orígenes que sabemos que permiten CORS: con los demás el
// navegador registraría un error en consola por cada logo.
function allowsCors(src: string): boolean {
  try {
    const url = new URL(src, window.location.href);
    return url.origin === window.location.origin || url.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

export function fitLogo(src: string): Promise<string | null> {
  if (!allowsCors(src)) return Promise.resolve(null);
  let job = cache.get(src);
  if (!job) {
    job = process(src).catch(() => null);
    cache.set(src, job);
  }
  return job;
}

export function useFittedLogo(src: string | null): string | null {
  // Se guarda junto a la imagen de la que sale: si la burbuja cambia de logo, el
  // resultado anterior deja de valer sin tener que vaciarlo.
  const [fitted, setFitted] = useState<{ src: string; url: string | null } | null>(null);
  useEffect(() => {
    if (!src) return;
    let alive = true;
    fitLogo(src).then((url) => {
      if (alive) setFitted({ src, url });
    });
    return () => {
      alive = false;
    };
  }, [src]);
  return fitted && fitted.src === src ? fitted.url : null;
}

async function process(src: string): Promise<string | null> {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = src;
  await img.decode();
  const W = img.naturalWidth;
  const H = img.naturalHeight;
  if (!W || !H) return null;

  // Se analiza una copia pequeña; el recorte se aplica sobre la imagen original.
  const k = Math.min(1, SAMPLE / Math.max(W, H));
  const w = Math.max(1, Math.round(W * k));
  const h = Math.max(1, Math.round(H * k));
  const probe = document.createElement('canvas');
  probe.width = w;
  probe.height = h;
  const pctx = probe.getContext('2d', { willReadFrequently: true });
  if (!pctx) return null;
  pctx.drawImage(img, 0, 0, w, h);
  const data = pctx.getImageData(0, 0, w, h).data; // lanza si la imagen no permite CORS
  const at = (x: number, y: number): RGBA => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const out = document.createElement('canvas');
  out.width = SIZE;
  out.height = SIZE;
  const ctx = out.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingQuality = 'high';

  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const transparent = corners.filter((c) => c[3] < 20).length >= 3;
  const uniform = corners.every((c) => near(c, corners[0], 18));

  const drawCover = () => {
    const s = Math.max(SIZE / W, SIZE / H);
    ctx.drawImage(img, (SIZE - W * s) / 2, (SIZE - H * s) / 2, W * s, H * s);
  };

  if (!transparent && !uniform) {
    // A sangre: cuadrada, recorte central; alargada, entera sobre sí misma difuminada.
    if (Math.max(W, H) / Math.min(W, H) < 1.1) {
      drawCover();
    } else {
      ctx.filter = 'blur(12px) brightness(0.85)';
      drawCover();
      ctx.filter = 'none';
      const s = (SIZE * DIAGONAL) / Math.hypot(W, H);
      ctx.drawImage(img, (SIZE - W * s) / 2, (SIZE - H * s) / 2, W * s, H * s);
    }
    return out.toDataURL('image/webp', 0.9);
  }

  let bg = avg(corners);
  let box = { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  for (let pass = 0; pass < 4; pass++) {
    const isContent = (x: number, y: number) => {
      const p = at(x, y);
      return transparent ? p[3] > 40 : p[3] > 40 && !near(p, bg, 30);
    };
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = box.minY; y <= box.maxY; y++) {
      for (let x = box.minX; x <= box.maxX; x++) {
        if (!isContent(x, y)) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) return null;
    box = { minX, minY, maxX, maxY };

    // Marco: unas pocas líneas casi llenas seguidas de vacío en los cuatro lados.
    const rowFill = (y: number) => { let n = 0; for (let x = minX; x <= maxX; x++) n += +isContent(x, y); return n / (maxX - minX + 1); };
    const colFill = (x: number) => { let n = 0; for (let y = minY; y <= maxY; y++) n += +isContent(x, y); return n / (maxY - minY + 1); };
    const lines = (fill: (v: number) => number, from: number, step: number) => {
      let skip = 0;
      while (skip < 2 && fill(from + skip * step) < 0.15) skip++;
      let n = 0;
      while (n < 6 && fill(from + (skip + n) * step) > 0.6) n++;
      return n > 0 && fill(from + (skip + n) * step) < 0.15 ? skip + n : 0;
    };
    const t = lines(rowFill, minY, 1), b = lines(rowFill, maxY, -1), l = lines(colFill, minX, 1), r = lines(colFill, maxX, -1);
    if (t && b && l && r && maxX - minX > 20 && maxY - minY > 20) {
      box = { minX: minX + l + 2, minY: minY + t + 2, maxX: maxX - r - 2, maxY: maxY - b - 2 };
      continue;
    }
    if (transparent) break;
    // Otro fondo liso dentro del primero.
    const inner = [at(minX, minY), at(maxX, minY), at(minX, maxY), at(maxX, maxY)];
    if (!inner.every((c) => near(c, inner[0], 18)) || near(inner[0], bg, 30)) break;
    bg = avg(inner);
  }

  // De la copia pequeña a la imagen original.
  const sx = box.minX / k;
  const sy = box.minY / k;
  const sw = (box.maxX - box.minX + 1) / k;
  const sh = (box.maxY - box.minY + 1) / k;
  const s = (SIZE * DIAGONAL) / Math.hypot(sw, sh);
  if (!transparent) {
    ctx.fillStyle = `rgb(${bg.join(',')})`;
    ctx.fillRect(0, 0, SIZE, SIZE);
  }
  ctx.drawImage(img, sx, sy, sw, sh, (SIZE - sw * s) / 2, (SIZE - sh * s) / 2, sw * s, sh * s);
  return out.toDataURL('image/webp', 0.9);
}
