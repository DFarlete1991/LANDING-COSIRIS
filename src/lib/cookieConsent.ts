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

export interface ConsentChoice {
  analytics: boolean; // Google Tag Manager -> Google Analytics + Google Ads
  marketing: boolean; // Meta Pixel
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
  if (choice.marketing) loadMetaPixel();
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

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}
