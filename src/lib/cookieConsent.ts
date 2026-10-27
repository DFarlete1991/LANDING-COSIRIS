// Gestión de consentimiento de cookies (art. 22.2 LSSI). Antes de este
// módulo, GTM y Meta Pixel se cargaban en index.html sin condición alguna —
// ahora ningún script no esencial se inyecta hasta que el usuario elige.
//
// Solo hay dos categorías reales porque son las dos que este código puede
// activar/desactivar de forma independiente: el contenedor de Google Tag
// Manager (que a su vez dispara Google Analytics y Google Ads — esos tags
// se configuran dentro del propio GTM, fuera de este repo) y el Meta Pixel,
// que se inyecta directamente aquí.

const STORAGE_KEY = 'cosiris_cookie_consent_v1';
const GTM_ID = 'GTM-MWTG2SB';
const META_PIXEL_ID = '1241986738137530';
const OPENAI_PIXEL_ID = 'VtNEai4EiqbyZWZk9vEGRu';
// Campaña propia de un cliente (Boinder Real Estate): su píxel solo se
// inicializa en su ficha pública, además del píxel general de Cosiris.
const OPENAI_BOINDER_PIXEL_ID = 'GH8N8hnLoEBXrnBvrrbhd6';
const OPENAI_BOINDER_PATH = '/inmobiliarias-en-madrid/boinder-real-estate';

export interface ConsentChoice {
  analytics: boolean; // Google Tag Manager -> Google Analytics + Google Ads
  marketing: boolean; // Meta Pixel + píxel de OpenAI (ChatGPT Ads)
  decidedAt: string;
}

type ConsentListener = (choice: ConsentChoice) => void;
const listeners = new Set<ConsentListener>();

export function getStoredConsent(): ConsentChoice | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.analytics === 'boolean' && typeof parsed?.marketing === 'boolean') {
      return parsed as ConsentChoice;
    }
    return null;
  } catch {
    return null;
  }
}

function applyConsent(choice: ConsentChoice) {
  if (choice.analytics) loadGoogleTagManager();
  if (choice.marketing) {
    loadMetaPixel();
    loadOpenAIPixel();
  }
  listeners.forEach((listener) => listener(choice));
}

export function saveConsent(choice: Omit<ConsentChoice, 'decidedAt'>): void {
  const full: ConsentChoice = { ...choice, decidedAt: new Date().toISOString() };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(full));
  } catch {
    // Almacenamiento no disponible (modo privado, etc.) — no rompemos el flujo,
    // solo no persiste entre visitas.
  }
  applyConsent(full);
}

export function clearConsent(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Aplica el consentimiento ya guardado (llamar una vez al arrancar la app). */
export function applyStoredConsentOnLoad(): void {
  const stored = getStoredConsent();
  if (stored) applyConsent(stored);
}

export function onConsentApplied(listener: ConsentListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

let gtmLoaded = false;
function loadGoogleTagManager(): void {
  if (gtmLoaded || typeof document === 'undefined') return;
  gtmLoaded = true;

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`;
  document.head.appendChild(script);

  const noscript = document.createElement('noscript');
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.googletagmanager.com/ns.html?id=${GTM_ID}`;
  iframe.height = '0';
  iframe.width = '0';
  iframe.style.display = 'none';
  iframe.style.visibility = 'hidden';
  noscript.appendChild(iframe);
  document.body.prepend(noscript);
}

let metaPixelLoaded = false;
function loadMetaPixel(): void {
  if (metaPixelLoaded || typeof document === 'undefined') return;
  metaPixelLoaded = true;

  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = (f.fbq = function (...args: unknown[]) {
      n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = '2.0';
    n.queue = [];
    const t = b.createElement(e);
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
  /* eslint-enable */

  window.fbq?.('init', META_PIXEL_ID);
  window.fbq?.('track', 'PageView');

  const noscript = document.createElement('noscript');
  const img = document.createElement('img');
  img.height = 1;
  img.width = 1;
  img.style.display = 'none';
  img.src = `https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`;
  noscript.appendChild(img);
  document.body.appendChild(noscript);
}

let openAIPixelLoaded = false;
function loadOpenAIPixel(): void {
  if (openAIPixelLoaded || !OPENAI_PIXEL_ID || typeof document === 'undefined') return;
  openAIPixelLoaded = true;

  /* eslint-disable */
  (function (w: any, d: Document, s: string, u: string) {
    if (w.oaiq) return;
    const q: any = function (...args: unknown[]) {
      q.q.push(args);
    };
    q.q = [];
    w.oaiq = q;
    const js = d.createElement(s) as HTMLScriptElement;
    js.async = true;
    js.src = u;
    const f = d.getElementsByTagName(s)[0];
    f.parentNode!.insertBefore(js, f);
  })(window, document, 'script', 'https://bzrcdn.openai.com/sdk/oaiq.min.js');
  /* eslint-enable */

  // Solo se llama aquí si el usuario aceptó marketing, así que el consentimiento es true.
  window.oaiq?.('init', { pixelId: OPENAI_PIXEL_ID });
  bridgeDataLayerToOpenAI();
  syncOpenAIRoute(window.location.pathname);
}

// Los formularios ya avisan de sus conversiones a GTM con dataLayer.push; en
// vez de tocar cada uno, se replica aquí lo que sea una conversión.
const DATALAYER_TO_OPENAI: Record<string, [string, string]> = {
  generate_lead: ['lead_created', 'customer_action'],
  lead_inmobiliaria_enviado: ['lead_created', 'customer_action'],
  registro_inmobiliaria_completado: ['registration_completed', 'customer_action'],
};
let bridged = false;
function bridgeDataLayerToOpenAI(): void {
  if (bridged) return;
  bridged = true;
  window.dataLayer = window.dataLayer || [];
  const dl = window.dataLayer;
  const original = dl.push.bind(dl);
  dl.push = (...items: Record<string, unknown>[]) => {
    for (const item of items) {
      const hit = DATALAYER_TO_OPENAI[(item as { event?: string })?.event ?? ''];
      if (hit) window.oaiq?.('measure', hit[0], { type: hit[1] });
    }
    return original(...items);
  };
}

// Las páginas "gracias" son una carga completa tras enviar el formulario
// (ContactModal, Vender, Valoración): ahí se cuenta el lead.
const THANKS_PATHS = new Set(['/gracias', '/gracias-vender']);
let boinderInit = false;
let lastPathTracked = '';

/** Llamar en cada cambio de ruta (SPA). No hace nada si no hay consentimiento. */
export function syncOpenAIRoute(pathname: string): void {
  if (!openAIPixelLoaded || !window.oaiq || pathname === lastPathTracked) return;
  lastPathTracked = pathname;
  if (!boinderInit && pathname.replace(/\/$/, '') === OPENAI_BOINDER_PATH) {
    boinderInit = true;
    window.oaiq('init', { pixelId: OPENAI_BOINDER_PIXEL_ID });
  }
  window.oaiq('measure', 'page_viewed', { type: 'contents' });
  if (THANKS_PATHS.has(pathname)) window.oaiq('measure', 'lead_created', { type: 'customer_action' });
}

declare global {
  interface Window {
    oaiq?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}
