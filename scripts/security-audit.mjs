// Auditoría de seguridad del sitio, basada en las categorías del OWASP WSTG
// que aplican a esta SPA estática (WSTG-CONF: config/cabeceras/secretos,
// WSTG-CLNT: XSS/postMessage/window.open, WSTG-INFO: dependencias).
// Corre en CI (.github/workflows/security-audit.yml) en cada push/PR, y
// localmente con `npm run security-audit` antes de cada deploy.
//
// Cada check imprime OK/FAIL y agrega su mensaje a `failures`; al final
// se resume todo y se sale con código 1 si algo falló, para que tanto un
// humano en la terminal como CI vean de un vistazo qué revisar.
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const failures = [];
const warnings = [];

function section(title) {
  console.log(`\n▶ ${title}`);
}

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  console.log(`  ✗ ${msg}`);
  failures.push(msg);
}

function warn(msg) {
  console.log(`  ! ${msg}`);
  warnings.push(msg);
}

function run(cmd, args) {
  return execFileSync(cmd, args, { cwd: ROOT, encoding: 'utf-8', shell: true });
}

function trackedFiles() {
  return run('git', ['ls-files']).split('\n').filter(Boolean);
}

// ── 1. Dependencias vulnerables (WSTG-INFO / higiene de dependencias) ──────
section('npm audit (dependencias con CVEs conocidos)');
try {
  run('npm', ['audit', '--audit-level=high', '--omit=dev']);
  ok('Sin vulnerabilidades high/critical en dependencias de producción.');
} catch (e) {
  // npm audit sale con código != 0 si encuentra vulnerabilidades del nivel pedido.
  fail('npm audit encontró vulnerabilidades high/critical. Corre `npm audit fix` (o revisa `npm audit` para las que necesiten --force).');
  console.log(e.stdout || e.message);
}

// ── 2. Secretos commiteados (WSTG-CONF-05) ─────────────────────────────────
section('Secretos en archivos versionados');
const files = trackedFiles();
const SECRET_PATTERNS = [
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/ },
  { name: 'JWT / Supabase key', re: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/ },
  { name: 'Clave privada PEM', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
];
const SKIP_DIRS = ['node_modules/', 'dist/', 'package-lock.json'];
let secretsFound = false;
for (const file of files) {
  if (SKIP_DIRS.some((d) => file.startsWith(d))) continue;
  const path = resolve(ROOT, file);
  if (!existsSync(path)) continue;
  let content;
  try {
    content = readFileSync(path, 'utf-8');
  } catch {
    continue; // binario u otro problema de lectura — no es un archivo de texto a escanear
  }
  for (const { name, re } of SECRET_PATTERNS) {
    if (re.test(content)) {
      fail(`Posible ${name} commiteado en ${file}. Si es real, ROTA la credencial y usa variables de entorno (.env.local, no versionado).`);
      secretsFound = true;
    }
  }
}
if (!secretsFound) ok('No se encontraron patrones de secretos conocidos en archivos versionados.');

// .env.example nunca debe llevar valores reales — solo placeholders.
if (files.includes('.env.example')) {
  const example = readFileSync(resolve(ROOT, '.env.example'), 'utf-8');
  if (!/your-|REEMPLAZA|<.*>|xxx/i.test(example) || SECRET_PATTERNS.some(({ re }) => re.test(example))) {
    warn('.env.example: confirma a mano que todos los valores son placeholders, no credenciales reales.');
  } else {
    ok('.env.example contiene solo placeholders.');
  }
}

// Ningún .env real (solo .env.example) debe estar trackeado por git.
const trackedEnvFiles = files.filter((f) => /(^|\/)\.env(\.|$)/.test(f) && !f.endsWith('.env.example'));
if (trackedEnvFiles.length > 0) {
  fail(`Archivo(s) .env reales trackeados por git: ${trackedEnvFiles.join(', ')}. Deben ir solo en .env.local (gitignored).`);
} else {
  ok('Ningún .env real está trackeado por git.');
}

// ── 3. Cabeceras de seguridad (WSTG-CONF-07/08: CSP, clickjacking, MIME) ───
section('Cabeceras de seguridad (vercel.json)');
try {
  run('node', ['scripts/sync-vercel-headers.mjs', '--check']);
  ok('vercel.json está sincronizado con scripts/security-headers.mjs.');
} catch (e) {
  fail('vercel.json desincronizado de scripts/security-headers.mjs — corre `node scripts/sync-vercel-headers.mjs`.');
  console.log(e.stdout || e.message);
}

const vercelJson = JSON.parse(readFileSync(resolve(ROOT, 'vercel.json'), 'utf-8'));
const headerMap = Object.fromEntries(
  (vercelJson.headers?.[0]?.headers ?? []).map((h) => [h.key, h.value]),
);
const REQUIRED_HEADERS = [
  'Content-Security-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Referrer-Policy',
  'Permissions-Policy',
  'Strict-Transport-Security',
];
for (const key of REQUIRED_HEADERS) {
  if (headerMap[key]) ok(`${key} presente.`);
  else fail(`Falta la cabecera ${key} en vercel.json.`);
}
const csp = headerMap['Content-Security-Policy'] ?? '';
for (const token of ["object-src 'none'", 'frame-ancestors', 'upgrade-insecure-requests']) {
  if (csp.includes(token)) ok(`CSP incluye "${token}".`);
  else fail(`La CSP perdió "${token}" — revisa que no se haya debilitado sin querer.`);
}
if (/script-src[^;]*\*(?!\.)/.test(csp.replace(/https:\/\/\*\./g, ''))) {
  fail('La CSP tiene un wildcard "*" suelto en script-src — permitiría cargar scripts de cualquier dominio.');
}

// ── 4. Patrones de riesgo en el código fuente (WSTG-CLNT) ──────────────────
section('Patrones de riesgo en src/ (XSS / postMessage / sinks peligrosos)');
const srcFiles = files.filter((f) => f.startsWith('src/') && /\.(tsx?|jsx?)$/.test(f));

const DANGEROUS_SINKS = [
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML/ },
  { name: 'eval(', re: /\beval\(/ },
  { name: 'new Function(', re: /new Function\(/ },
  { name: 'document.write(', re: /document\.write\(/ },
];
let sinkFound = false;
for (const file of srcFiles) {
  const content = readFileSync(resolve(ROOT, file), 'utf-8');
  for (const { name, re } of DANGEROUS_SINKS) {
    if (re.test(content)) {
      fail(`${file}: usa ${name} — requiere revisión manual de que el contenido no venga de datos de usuario/API sin sanitizar.`);
      sinkFound = true;
    }
  }
}
if (!sinkFound) ok('Sin dangerouslySetInnerHTML / eval / new Function / document.write en src/.');

// postMessage con target de origen '*' — WSTG-CLNT-11.
// El primer argumento de postMessage suele ser una llamada anidada (p.ej.
// JSON.stringify(...)), así que no se puede exigir que "postMessage(" y el
// '*' final estén separados solo por texto sin paréntesis — en vez de
// balancear paréntesis a mano, se busca el patrón `, '*')` de cierre y se
// confirma que "postMessage" aparece un poco antes en el mismo archivo.
let wildcardPostMessage = false;
for (const file of srcFiles) {
  const content = readFileSync(resolve(ROOT, file), 'utf-8');
  const closeRe = /,\s*['"]\*['"]\s*\)/g;
  let m;
  while ((m = closeRe.exec(content))) {
    const windowStart = Math.max(0, m.index - 300);
    if (/postMessage\s*\(/.test(content.slice(windowStart, m.index))) {
      fail(`${file}: postMessage(..., '*') — especifica el origen exacto del iframe/ventana destino.`);
      wildcardPostMessage = true;
    }
  }
}
if (!wildcardPostMessage) ok("Sin postMessage con target de origen '*' en src/.");

// target="_blank" sin rel="noopener"/"noreferrer" — reverse tabnabbing.
let tabnabbingFound = false;
for (const file of srcFiles) {
  const content = readFileSync(resolve(ROOT, file), 'utf-8');
  const tagMatches = content.match(/<a\b[^>]*>/g) ?? [];
  for (const tag of tagMatches) {
    if (/target\s*=\s*["']_blank["']/.test(tag) && !/rel\s*=\s*["'][^"']*noopener/.test(tag)) {
      fail(`${file}: <a target="_blank"> sin rel="noopener noreferrer" — permite reverse tabnabbing.`);
      tabnabbingFound = true;
    }
  }
}
if (!tabnabbingFound) ok('Todo target="_blank" en src/ lleva rel="noopener noreferrer".');

// ── Resumen ─────────────────────────────────────────────────────────────
console.log('\n' + '─'.repeat(60));
if (failures.length === 0) {
  console.log(`✅ Auditoría de seguridad OK (${warnings.length} aviso(s)).`);
  process.exit(0);
} else {
  console.log(`❌ Auditoría de seguridad FALLÓ — ${failures.length} problema(s):`);
  for (const f of failures) console.log(`   - ${f}`);
  process.exit(1);
}
