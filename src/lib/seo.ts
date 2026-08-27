import { useEffect } from 'react';

export const SITE_URL = 'https://cosiris.com';
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/logo_orange.png`;

type SEOOptions = {
  title: string;
  description: string;
  /** Ruta absoluta (empieza por "/"), usada para canonical y og:url. */
  path: string;
  image?: string;
  /** Páginas de agradecimiento/transaccionales: no deben indexarse. */
  noindex?: boolean;
  /** false mientras los datos reales (ej. una inmobiliaria) aún cargan. */
  enabled?: boolean;
};

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

/**
 * Sobrescribe título, meta description, canonical y og/twitter tags al
 * montar una página. Necesario porque Vercel sirve el mismo HTML estático
 * (index.html o inmobiliarias.html, ver vercel.json) para todas las rutas de
 * su bundle — sin esto Google ve el mismo <title>/<meta description> en
 * decenas de páginas distintas (incluida cada inmobiliaria del directorio) y
 * las trata como contenido duplicado, dejando la mayoría sin indexar.
 */
export function useSEO({ title, description, path, image = DEFAULT_OG_IMAGE, noindex = false, enabled = true }: SEOOptions) {
  useEffect(() => {
    if (!enabled) return;
    const url = `${SITE_URL}${path}`;

    document.title = title;
    upsertMeta('name', 'description', description);
    upsertLink('canonical', url);

    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', url);
    upsertMeta('property', 'og:image', image);

    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertMeta('name', 'twitter:image', image);

    let robotsEl = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noindex) {
      if (!robotsEl) {
        robotsEl = document.createElement('meta');
        robotsEl.setAttribute('name', 'robots');
        document.head.appendChild(robotsEl);
      }
      robotsEl.setAttribute('content', 'noindex, follow');
    } else if (robotsEl) {
      robotsEl.remove();
    }
  }, [title, description, path, image, noindex, enabled]);
}
