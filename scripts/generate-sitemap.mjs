// Genera public/sitemap.xml antes de `vite build` (ver "build" en package.json),
// para que Vite lo copie a dist/ como cualquier otro archivo estático. Incluye
// tanto las páginas fijas como el perfil público de cada inmobiliaria activa
// en Supabase — sin esto Google no tiene forma de descubrir esas URLs salvo
// rastreando enlaces internos, y muchas quedan "Detectada, actualmente sin
// indexar" en Search Console.
import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const SITE_URL = 'https://cosiris.com';

// Vite inyecta VITE_* desde .env.local automáticamente en la app, pero este
// script corre fuera de Vite — en Vercel las variables ya están en
// process.env (configuradas en el dashboard); en local no, así que se leen
// a mano si hace falta.
function loadLocalEnv() {
  if (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_ANON_KEY) return;
  for (const file of ['.env.local', '.env']) {
    const path = resolve(process.cwd(), file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, 'utf-8').split('\n')) {
      const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)?\s*$/);
      if (!match) continue;
      const [, key, rawValue = ''] = match;
      if (process.env[key] === undefined) {
        process.env[key] = rawValue.replace(/^["']|["']$/g, '');
      }
    }
  }
}

// Debe reflejar exactamente src/lib/agency-url.ts (slugify + buildAgencySlugMap)
// — duplicado aquí porque este script corre con Node plano, sin el alias "@"
// ni el resto del entorno de Vite/TS.
function slugify(text) {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildAgencyPaths(agencies) {
  const byCity = new Map();
  for (const agency of agencies) {
    const city = slugify(agency.poblacion) || 'espana';
    const group = byCity.get(city);
    if (group) group.push(agency);
    else byCity.set(city, [agency]);
  }

  const paths = [];
  for (const [city, group] of byCity) {
    const used = new Set();
    for (const agency of [...group].sort((a, b) => a.id.localeCompare(b.id))) {
      const base = slugify(agency.nombre_comercial) || 'inmobiliaria';
      let slug = base;
      if (used.has(slug)) {
        const short = slugify(agency.id).slice(0, 6);
        slug = short ? `${base}-${short}` : base;
        let n = 2;
        while (used.has(slug)) slug = `${base}-${short || 'x'}-${n++}`;
      }
      used.add(slug);
      paths.push(`/inmobiliarias-en-${city}/${slug}`);
    }
  }
  return paths;
}

async function fetchAgencyPaths() {
  loadLocalEnv();
  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    console.warn('[generate-sitemap] Supabase no configurado — sitemap solo tendrá las páginas fijas.');
    return [];
  }

  const supabase = createClient(url, anonKey);
  const { data, error } = await supabase
    .from('directorio_inmobiliarias_publico')
    .select('id, nombre_comercial, poblacion');

  if (error || !data) {
    console.warn('[generate-sitemap] No se pudo leer el directorio:', error?.message);
    return [];
  }

  return buildAgencyPaths(data);
}

const STATIC_PATHS = [
  { path: '/', priority: '1.0' },
  { path: '/nosotros', priority: '0.6' },
  { path: '/servicios', priority: '0.6' },
  { path: '/valoratuvivienda', priority: '0.7' },
  { path: '/vendetuvivienda', priority: '0.7' },
  { path: '/captacion_inmobiliarias', priority: '0.7' },
  { path: '/inmobiliarias', priority: '0.9' },
  { path: '/inmobiliarias/planes', priority: '0.5' },
  { path: '/inmobiliarias/registro', priority: '0.5' },
  { path: '/inmobiliarias/valorar', priority: '0.6' },
  { path: '/aviso-legal', priority: '0.2' },
  { path: '/terminos-condiciones', priority: '0.2' },
  { path: '/privacidad', priority: '0.2' },
  { path: '/cookies', priority: '0.2' },
];

function xmlEscape(value) {
  return value.replace(/&/g, '&amp;');
}

async function main() {
  const agencyPaths = await fetchAgencyPaths();
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = STATIC_PATHS.map(
    ({ path, priority }) =>
      `  <url>\n    <loc>${xmlEscape(SITE_URL + path)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${priority}</priority>\n  </url>`,
  );

  const agencyEntries = agencyPaths.map(
    (path) =>
      `  <url>\n    <loc>${xmlEscape(SITE_URL + path)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>0.8</priority>\n  </url>`,
  );

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...staticEntries, ...agencyEntries].join('\n')}\n</urlset>\n`;

  writeFileSync(resolve(process.cwd(), 'public/sitemap.xml'), xml, 'utf-8');
  console.log(`[generate-sitemap] Escrito public/sitemap.xml con ${STATIC_PATHS.length} páginas fijas + ${agencyPaths.length} perfiles de inmobiliaria.`);
}

main();
