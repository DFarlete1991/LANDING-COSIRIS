import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

// URL del perfil público de una inmobiliaria. Antes era /inmobiliarias/<uuid>,
// que no dice nada ni a un humano ni a un buscador; ahora se arma con la
// ciudad y el nombre comercial: /inmobiliarias-en-madrid/infinity-homes.
// Las URLs viejas con uuid siguen resolviendo (ver App.tsx) porque ya se han
// compartido por WhatsApp y no pueden romperse.

const CITY_PREFIX = '/inmobiliarias-en-';

// Acepta null/undefined a propósito: aunque el tipo diga `string`, la vista
// del CRM devuelve inmobiliarias reales con `poblacion` a null (tienen
// lat/lng, así que el directorio sí las muestra) y sin esto reventaría al
// armar su URL.
export function slugify(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .normalize('NFD')
    // Quita los diacríticos que NFD acaba de separar de su letra base, para
    // que "Málaga" y "Donostia / San Sebastián" den slugs ASCII limpios.
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function citySlugOf(agency: InmobiliariaPublica): string {
  return slugify(agency.poblacion) || 'espana';
}

function baseNameSlugOf(agency: InmobiliariaPublica): string {
  return slugify(agency.nombre_comercial) || 'inmobiliaria';
}

/**
 * id de inmobiliaria → slug de su perfil, resolviendo los nombres repetidos.
 *
 * Dos inmobiliarias que se llamen igual en la misma ciudad no pueden compartir
 * URL. La primera —ordenando por id, no por el orden en que lleguen de
 * Supabase, para que el slug de un perfil no cambie entre cargas— se queda el
 * slug limpio y a las siguientes se les añade un sufijo con el arranque de su
 * id. El registro de slugs usados es por ciudad y no por nombre: así un
 * "casa-2" generado como desempate nunca puede chocar con una inmobiliaria que
 * de verdad se llame "Casa 2".
 */
export function buildAgencySlugMap(agencies: InmobiliariaPublica[]): Map<string, string> {
  const byCity = new Map<string, InmobiliariaPublica[]>();
  for (const agency of agencies) {
    const city = citySlugOf(agency);
    const group = byCity.get(city);
    if (group) group.push(agency);
    else byCity.set(city, [agency]);
  }

  const slugById = new Map<string, string>();

  for (const group of byCity.values()) {
    const used = new Set<string>();
    for (const agency of [...group].sort((a, b) => a.id.localeCompare(b.id))) {
      const base = baseNameSlugOf(agency);
      let slug = base;

      if (used.has(slug)) {
        const short = slugify(agency.id).slice(0, 6);
        slug = short ? `${base}-${short}` : base;
        let n = 2;
        while (used.has(slug)) slug = `${base}-${short || 'x'}-${n++}`;
      }

      used.add(slug);
      slugById.set(agency.id, slug);
    }
  }

  return slugById;
}

/** Ruta del perfil, opcionalmente conservando la query de la búsqueda. */
export function agencyProfilePath(
  agency: InmobiliariaPublica,
  agencies: InmobiliariaPublica[],
  search = '',
): string {
  const slug = buildAgencySlugMap(agencies).get(agency.id) ?? slugify(agency.id);
  return `${CITY_PREFIX}${citySlugOf(agency)}/${slug}${search}`;
}

/** `/inmobiliarias-en-madrid/infinity-homes` → `{ city, slug }`. */
export function parseAgencyProfilePath(pathname: string): { city: string; slug: string | null } | null {
  if (!pathname.startsWith(CITY_PREFIX)) return null;

  const [city, slug, ...rest] = pathname.slice(CITY_PREFIX.length).split('/').filter(Boolean);
  if (!city || rest.length > 0) return null;

  return { city, slug: slug ? decodeURIComponent(slug) : null };
}

/**
 * slug de ciudad de la URL → nombre legible, para cuando `poblacion` llega
 * vacío de la vista del CRM (ver comentario de `slugify`). "donosti" →
 * "Donosti", "san-sebastian" → "San Sebastian". No recupera acentos/eñes
 * perdidos al hacer el slug — es un fallback de emergencia, no un dato
 * fiable — pero evita el hueco vacío ("Estamos en , Gipuzkoa") mientras se
 * corrige el dato real en el CRM.
 */
export function humanizeCitySlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function findAgencyByProfilePath(
  agencies: InmobiliariaPublica[],
  city: string,
  slug: string,
): InmobiliariaPublica | null {
  const slugById = buildAgencySlugMap(agencies);
  return (
    agencies.find((agency) => citySlugOf(agency) === city && slugById.get(agency.id) === slug) ?? null
  );
}
