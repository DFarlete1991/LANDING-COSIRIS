// Genera nginx.conf a partir de scripts/security-headers.mjs (misma fuente
// única que vercel.json y vite.config.ts) — este es el que de verdad aplica
// en producción: el sitio se despliega en Dokploy vía el Dockerfile de este
// repo (nginx sirviendo dist/), no en Vercel. vercel.json se deja igual por
// si alguna vez se vuelve a usar Vercel, pero hoy es config inerte.
//
// Uso: node scripts/sync-nginx-config.mjs         → escribe nginx.conf
//      node scripts/sync-nginx-config.mjs --check  → solo verifica (exit 1 si difiere)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SECURITY_HEADERS } from './security-headers.mjs';

const nginxConfPath = resolve(process.cwd(), 'nginx.conf');

function nginxEscape(value) {
  // Escapa comillas dobles para que el valor quepa entero en un solo
  // add_header "..."; el resto de directivas nginx no usan estos valores
  // como código, así que no hace falta escapar nada más.
  return value.replace(/"/g, '\\"');
}

const headerLines = Object.entries(SECURITY_HEADERS)
  .map(([key, value]) => `    add_header ${key} "${nginxEscape(value)}" always;`)
  .join('\n');

const nextText = `# Generado por scripts/sync-nginx-config.mjs a partir de scripts/security-headers.mjs.
# No editar a mano — corre \`node scripts/sync-nginx-config.mjs\` despues de tocar
# la fuente unica de cabeceras.
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Sin esto Cache-Control/gzip quedaban en cero (auditoria de rendimiento
    # 2026-09: PageSpeed reportaba 5.4MB de ahorro potencial de cache y 60/100
    # de performance) — nginx no comprime ni cachea nada por defecto.
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 512;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml image/svg+xml font/ttf font/otf application/font-woff application/font-woff2 application/wasm;

${headerLines}

    # JS/CSS de Vite llevan hash de contenido en el nombre (main-oWtxNc1y.js):
    # si el contenido cambia, cambia el nombre. Cache de un año es seguro.
    # OJO: add_header en un location NO hereda los add_header del server (los
    # reemplaza), asi que las cabeceras de seguridad se repiten aqui.
    location ~* \\.(js|css)$ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
${headerLines}
        try_files $uri =404;
    }

    # Resto de estaticos (imagenes, video, fuentes) no llevan hash en el
    # nombre, asi que el cache es mas corto por si se reemplaza el archivo.
    location ~* \\.(png|jpg|jpeg|webp|gif|svg|ico|mp4|woff2?|ttf|otf)$ {
        add_header Cache-Control "public, max-age=2592000" always;
${headerLines}
        try_files $uri =404;
    }

    # Directorio de inmobiliarias: entrada HTML propia (og:title/og:description
    # distintos para que WhatsApp/Facebook, que no ejecutan JS, muestren el
    # resumen correcto) — igual que el rewrite que tenia vercel.json.
    location = /inmobiliarias {
        try_files /inmobiliarias.html =404;
    }
    location ~ ^/inmobiliarias/ {
        try_files /inmobiliarias.html =404;
    }

    # Resto de rutas: SPA (React Router del lado del cliente) — si el archivo
    # no existe literalmente, cae a index.html.
    location / {
        try_files $uri $uri/ /index.html;
    }
}
`;

if (process.argv.includes('--check')) {
  const normalize = (s) => s.replace(/\r\n/g, '\n');
  let currentText = '';
  try {
    currentText = readFileSync(nginxConfPath, 'utf-8');
  } catch {
    // nginx.conf no existe todavia — se trata igual que "desincronizado".
  }
  if (normalize(nextText) !== normalize(currentText)) {
    console.error(
      '[sync-nginx-config] nginx.conf está desincronizado con scripts/security-headers.mjs.\n' +
        'Corre `node scripts/sync-nginx-config.mjs` y commitea el resultado.',
    );
    process.exit(1);
  }
  console.log('[sync-nginx-config] nginx.conf OK — coincide con security-headers.mjs.');
  process.exit(0);
}

writeFileSync(nginxConfPath, nextText, 'utf-8');
console.log('[sync-nginx-config] nginx.conf actualizado con las cabeceras de security-headers.mjs.');
