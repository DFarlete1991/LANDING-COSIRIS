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

// Relleno de la URL cuando la inmobiliaria no tiene población — solo para
// que /inmobiliarias-en-<ciudad>/... nunca quede con un hueco vacío. No es
// una ciudad real: nada debe mostrarlo como si lo fuera (ver `displayCity`
// en InmobiliariaPerfilPage, que lo excluye a propósito de ese respaldo).
export const NO_CITY_SLUG = 'espana';

function citySlugOf(agency: InmobiliariaPublica): string {
  return slugify(agency.poblacion) || NO_CITY_SLUG;
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

// `slugify()` quita tildes/eñes a propósito (para que la URL quede en ASCII
// limpio), así que revertirlo letra por letra no puede recuperar "España" ni
// "Málaga" — sale "Espana", "Malaga". Estos son los nombres que de verdad
// aparecen en URLs de perfil (las 50 provincias españolas, ya usadas en
// CaptacionInmobiliariasPage/ContactModal, más "España", el valor con el que
// citySlugOf() rellena la URL cuando la inmobiliaria no tiene población).
// Si el slug no está en esta lista (una ciudad suelta tipo "donosti"),
// humanizeCitySlug cae a capitalizar cada palabra sin más.
const KNOWN_PLACE_NAMES = [
  'España',
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz',
  'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca',
  'Gipuzkoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca',
  'Islas Baleares', 'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas',
  'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca',
  'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
  'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
];

const KNOWN_PLACE_NAMES_BY_SLUG = new Map(KNOWN_PLACE_NAMES.map((name) => [slugify(name), name]));

/**
 * slug de ciudad de la URL → nombre legible, para cuando `poblacion` llega
 * vacío de la vista del CRM (ver comentario de `slugify`). "donosti" →
 * "Donosti", "san-sebastian" → "San Sebastian". Para provincias y "España"
 * (ver KNOWN_PLACE_NAMES) recupera la tilde real; cualquier otro slug es un
 * fallback de emergencia sin acentos — mejor eso que dejar el hueco vacío
 * ("Estamos en , Gipuzkoa") mientras se corrige el dato real en el CRM.
 */
export function humanizeCitySlug(slug: string): string {
  const known = KNOWN_PLACE_NAMES_BY_SLUG.get(slug);
  if (known) return known;

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
