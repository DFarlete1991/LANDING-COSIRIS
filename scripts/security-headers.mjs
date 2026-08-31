// Fuente única de las cabeceras de seguridad del sitio. La CSP se validó a
// mano con `vite preview` + un navegador real (ver scripts/security-audit.mjs
// y CLAUDE.md / notas de auditoría) contra: GTM + Google Ads/Analytics
// (incluye los scripts inline dinámicos que inyecta el "Conversion Linker",
// que no se pueden fijar por hash porque cambian en cada carga), Meta Pixel,
// Google Maps JS SDK + Embed + Static, YouTube/Vimeo embebidos, Supabase y
// los webhooks de n8n/CRM.
//
// Usada por vite.config.ts (preview.headers, para poder probar la CSP en
// local antes de cada deploy) y por scripts/sync-vercel-headers.mjs, que la
// escribe en vercel.json (lo que de verdad aplica Vercel en producción).
// Si cambias esto, corre `node scripts/sync-vercel-headers.mjs` para que
// vercel.json quede igual — scripts/security-audit.mjs falla si se
// desincronizan.
export const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "manifest-src 'self'",
    // 'unsafe-inline' en script-src: GTM/Google Ads inyectan <script> inline
    // con contenido distinto en cada carga (conversion linking) — un hash no
    // sirve ahí. El allowlist de hosts sigue bloqueando <script src> a
    // dominios no autorizados, que es el vector más común de XSS con impacto real.
    "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://*.google-analytics.com https://*.analytics.google.com https://googleads.g.doubleclick.net https://www.googleadservices.com https://maps.googleapis.com https://www.youtube.com",
    // 'unsafe-inline' en style-src: Framer Motion/GSAP escriben el atributo
    // style vía cssText en algunas animaciones, lo que CSP trata igual que un
    // style="" inline aunque no venga de HTML de origen dudoso.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    // Fotos/logos de cada inmobiliaria vienen de dominios arbitrarios (su propia
    // web, Cloudinary, picsum en datos de demo) — no se puede fijar un allowlist.
    'img-src \'self\' https: data: blob:',
    'media-src \'self\' https: blob:',
    [
      "connect-src 'self'",
      'https://*.supabase.co',
      'wss://*.supabase.co',
      'https://*.googleapis.com',
      'https://maps.google.com',
      'https://www.google.com',
      'https://*.doubleclick.net',
      'https://n8n.srv1123447.hstgr.cloud',
      'https://crm.cosiris.com',
      'https://google-analytics.com',
      'https://*.google-analytics.com',
      'https://analytics.google.com',
      'https://*.analytics.google.com',
      'https://www.googletagmanager.com',
      'https://www.facebook.com',
      'https://connect.facebook.net',
    ].join(' '),
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.google.com https://www.googletagmanager.com",
    "worker-src 'self' blob:",
    'upgrade-insecure-requests',
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};
