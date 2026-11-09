// Prepara los logos de clientes para mostrarse dentro de un círculo.
// Uso: npm run logos   (lee public/assets/clientes/*.webp y escribe en circulo/)
//
// Muchos logos llegan con su propio fondo (gris, azul, negro) y márgenes de
// sobra, y dentro del círculo se veían como un cuadradito. Para cada uno:
//  - Fondo transparente: se recorta el margen vacío y se deja transparente
//    (el círculo pone el blanco).
//  - Fondo liso de un color (las cuatro esquinas iguales): se recorta el margen
//    y se rellena el cuadrado con ese color, así el círculo entero es del color
//    del logo.
//  - Logo dentro de un marco (fondo, marco y otro fondo dentro): se repite el
//    recorte hasta llegar al logo y se usa el fondo de dentro.
//  - Imagen a sangre (esquinas distintas): si es cuadrada se recorta al centro;
//    si es alargada se muestra entera sobre una versión difuminada de sí misma.
// El logo se escala para que su diagonal ocupe el 88 % del círculo: los logos
// alargados no tocan el borde y los cuadrados no quedan diminutos.

import { readdir, mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'public/assets/clientes');
const OUT = join(SRC, 'circulo');
const SIZE = 256;
const DIAGONAL = 0.88;

const near = (a, b, t) => Math.abs(a[0] - b[0]) <= t && Math.abs(a[1] - b[1]) <= t && Math.abs(a[2] - b[2]) <= t;

async function processLogo(file) {
  const { data, info } = await sharp(join(SRC, file)).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const at = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const transparent = corners.filter((c) => c[3] < 20).length >= 3;
  const uniform = corners.every((c) => near(c, corners[0], 18));
  const out = join(OUT, file);

  if (!transparent && !uniform) {
    if (Math.max(w, h) / Math.min(w, h) < 1.1) {
      await sharp(join(SRC, file)).resize(SIZE, SIZE, { fit: 'cover' }).webp({ quality: 90 }).toFile(out);
      return `${file}: a sangre, recorte central`;
    }
    const scale = (SIZE * DIAGONAL) / Math.hypot(w, h);
    const lw = Math.round(w * scale);
    const lh = Math.round(h * scale);
    const backdrop = await sharp(join(SRC, file)).resize(SIZE, SIZE, { fit: 'cover' }).blur(18).modulate({ brightness: 0.85 }).toBuffer();
    const logo = await sharp(join(SRC, file)).resize(lw, lh).toBuffer();
    await sharp(backdrop)
      .composite([{ input: logo, left: Math.round((SIZE - lw) / 2), top: Math.round((SIZE - lh) / 2) }])
      .webp({ quality: 90 })
      .toFile(out);
    return `${file}: a sangre alargado, entero sobre fondo difuminado`;
  }

  // Recorta el fondo. Si lo que queda está rodeado por un marco (los cuatro
  // bordes son líneas casi continuas) o tiene dentro otro fondo liso, recorta
  // de nuevo por dentro.
  const avg = (cs) => [0, 1, 2].map((k) => Math.round(cs.reduce((s, c) => s + c[k], 0) / cs.length));
  let bg = avg(corners);
  let box = { minX: 0, minY: 0, maxX: w - 1, maxY: h - 1 };
  for (let pass = 0; pass < 4; pass++) {
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = box.minY; y <= box.maxY; y++) {
      for (let x = box.minX; x <= box.maxX; x++) {
        const p = at(x, y);
        const isContent = transparent ? p[3] > 40 : p[3] > 40 && !near(p, bg, 30);
        if (!isContent) continue;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    if (maxX < 0) throw new Error(`${file}: no se encontró el logo dentro de la imagen`);
    box = { minX, minY, maxX, maxY };
    const isContentAt = (x, y) => {
      const p = at(x, y);
      return transparent ? p[3] > 40 : p[3] > 40 && !near(p, bg, 30);
    };
    const rowFill = (y) => { let n = 0; for (let x = minX; x <= maxX; x++) n += isContentAt(x, y); return n / (maxX - minX + 1); };
    const colFill = (x) => { let n = 0; for (let y = minY; y <= maxY; y++) n += isContentAt(x, y); return n / (maxY - minY + 1); };
    // Un marco son unas pocas líneas casi llenas seguidas de vacío; se permite
    // saltar un par de píxeles sueltos en el borde. Devuelve cuánto quitar (0 = no hay marco).
    const lines = (fill, from, step) => {
      let skip = 0;
      while (skip < 2 && fill(from + skip * step) < 0.15) skip++;
      let k = 0;
      while (k < 6 && fill(from + (skip + k) * step) > 0.6) k++;
      return k > 0 && fill(from + (skip + k) * step) < 0.15 ? skip + k : 0;
    };
    const t = lines(rowFill, minY, 1), b = lines(rowFill, maxY, -1), l = lines(colFill, minX, 1), r = lines(colFill, maxX, -1);
    if (t && b && l && r && maxX - minX > 20 && maxY - minY > 20) {
      box = { minX: minX + l + 2, minY: minY + t + 2, maxX: maxX - r - 2, maxY: maxY - b - 2 };
      continue;
    }
    if (transparent) break;
    const inner = [at(minX, minY), at(maxX, minY), at(minX, maxY), at(maxX, maxY)];
    if (!inner.every((c) => near(c, inner[0], 18)) || near(inner[0], bg, 30)) break;
    bg = avg(inner);
  }
  const { minX, minY, maxX, maxY } = box;

  const cw = maxX - minX + 1;
  const ch = maxY - minY + 1;
  const scale = (SIZE * DIAGONAL) / Math.hypot(cw, ch);
  const lw = Math.max(1, Math.round(cw * scale));
  const lh = Math.max(1, Math.round(ch * scale));
  const logo = await sharp(join(SRC, file))
    .extract({ left: minX, top: minY, width: cw, height: ch })
    .resize(lw, lh)
    .toBuffer();
  const background = transparent ? { r: 0, g: 0, b: 0, alpha: 0 } : { r: bg[0], g: bg[1], b: bg[2], alpha: 1 };
  await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background } })
    .composite([{ input: logo, left: Math.round((SIZE - lw) / 2), top: Math.round((SIZE - lh) / 2) }])
    .webp({ quality: 90 })
    .toFile(out);
  return `${file}: ${transparent ? 'transparente' : `fondo rgb(${bg.join(',')})`}, logo ${cw}x${ch}px de ${w}x${h}`;
}

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => f.endsWith('.webp'));
for (const f of files) console.log(await processLogo(f));
console.log(`\n${files.length} logos listos en public/assets/clientes/circulo/`);
