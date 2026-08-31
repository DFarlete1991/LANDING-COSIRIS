// Escribe el bloque "headers" de vercel.json a partir de
// scripts/security-headers.mjs (fuente única) — así vercel.json (lo que
// aplica Vercel en producción) y vite.config.ts (preview.headers, para
// probar en local) nunca se desincronizan.
//
// Uso: node scripts/sync-vercel-headers.mjs         → escribe vercel.json
//      node scripts/sync-vercel-headers.mjs --check  → solo verifica (exit 1 si difiere)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SECURITY_HEADERS } from './security-headers.mjs';

const vercelJsonPath = resolve(process.cwd(), 'vercel.json');
const current = JSON.parse(readFileSync(vercelJsonPath, 'utf-8'));

const expectedHeadersBlock = [
  {
    source: '/(.*)',
    headers: Object.entries(SECURITY_HEADERS).map(([key, value]) => ({ key, value })),
  },
];

const next = { ...current, headers: expectedHeadersBlock };
const nextText = JSON.stringify(next, null, 2) + '\n';
const currentText = readFileSync(vercelJsonPath, 'utf-8');

if (process.argv.includes('--check')) {
  // Normaliza CRLF/LF antes de comparar: en Windows con core.autocrlf, git
  // reescribe vercel.json a CRLF en cada checkout — eso no es una
  // desincronización real de contenido, solo el estilo de fin de línea.
  const normalize = (s) => s.replace(/\r\n/g, '\n');
  if (normalize(nextText) !== normalize(currentText)) {
    console.error(
      '[sync-vercel-headers] vercel.json está desincronizado con scripts/security-headers.mjs.\n' +
        'Corre `node scripts/sync-vercel-headers.mjs` y commitea el resultado.',
    );
    process.exit(1);
  }
  console.log('[sync-vercel-headers] vercel.json OK — coincide con security-headers.mjs.');
  process.exit(0);
}

writeFileSync(vercelJsonPath, nextText, 'utf-8');
console.log('[sync-vercel-headers] vercel.json actualizado con las cabeceras de security-headers.mjs.');
