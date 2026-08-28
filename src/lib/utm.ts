// Captura de UTMs / click-ids de campañas (Meta, Google Ads...) para poder
// ver en el CRM y en los webhooks de n8n de qué anuncio salió cada lead, no
// solo cuántas visitas tuvo cada campaña en GA4.
//
// Se guarda en localStorage la primera vez que la URL trae parámetros de
// campaña, y esos datos se reutilizan mientras el visitante navega por el
// resto del sitio (la app es una SPA: al pasar de la landing del anuncio al
// formulario no hay recarga, así que sin esto se perderían los parámetros en
// cuanto cambiara la URL). Si vuelve más tarde con una campaña distinta, se
// sobreescribe (last-touch); pasados 90 días se considera caducado.

const STORAGE_KEY = 'cosiris_attribution_v1';
const MAX_AGE_DAYS = 90;

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id'] as const;

// gclid/gbraid/wbraid = Google Ads, fbclid = Meta, msclkid = Microsoft Ads,
// ttclid = TikTok Ads, li_fat_id = LinkedIn Ads.
const CLICK_ID_KEYS = ['gclid', 'gbraid', 'wbraid', 'fbclid', 'msclkid', 'ttclid', 'li_fat_id'] as const;

type UtmKey = (typeof UTM_KEYS)[number];
type ClickIdKey = (typeof CLICK_ID_KEYS)[number];

export type Attribution = Partial<Record<UtmKey | ClickIdKey, string>> & {
  // Parámetros hsa_* (Google Ads "Hosted Search Ads": hsa_acc, hsa_cam, hsa_grp...):
  // el número exacto de variantes cambia según el anuncio, así que se guardan
  // todos los que traiga la URL en vez de listarlos uno a uno.
  hsa_params?: Record<string, string>;
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
};

function readParamsFromUrl(): { attribution: Attribution; hasMarketingParams: boolean } {
  const params = new URLSearchParams(window.location.search);
  const attribution: Attribution = {};
  let hasMarketingParams = false;

  for (const key of UTM_KEYS) {
    const value = params.get(key);
    if (value) {
      attribution[key] = value;
      hasMarketingParams = true;
    }
  }
  for (const key of CLICK_ID_KEYS) {
    const value = params.get(key);
    if (value) {
      attribution[key] = value;
      hasMarketingParams = true;
    }
  }

  const hsaParams: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    if (key.startsWith('hsa_') && value) hsaParams[key] = value;
  }
  if (Object.keys(hsaParams).length > 0) {
    attribution.hsa_params = hsaParams;
    hasMarketingParams = true;
  }

  return { attribution, hasMarketingParams };
}

function readStored(): Attribution | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    if (!parsed.captured_at) return parsed;
    const ageDays = (Date.now() - new Date(parsed.captured_at).getTime()) / 86_400_000;
    return ageDays > MAX_AGE_DAYS ? null : parsed;
  } catch {
    return null;
  }
}

function store(attribution: Attribution) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Modo privado, cuota llena, etc. Sin persistencia cada formulario solo
    // verá los parámetros que traiga su propia URL en ese momento.
  }
}

// Llamar una vez al arrancar la app (App.tsx). Si la URL actual no trae
// ningún parámetro de campaña no hace nada, dejando la atribución que ya
// hubiera de una visita anterior en la misma sesión de navegación.
export function captureAttribution() {
  if (typeof window === 'undefined') return;

  const { attribution, hasMarketingParams } = readParamsFromUrl();
  if (!hasMarketingParams) return;

  store({
    ...attribution,
    landing_page: `${window.location.pathname}${window.location.search}`,
    referrer: document.referrer || undefined,
    captured_at: new Date().toISOString(),
  });
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  return readStored() ?? {};
}

// Aplana la atribución guardada a pares clave/valor de texto — lista para
// mezclar con el payload JSON (o FormData) que ya arma cada formulario antes
// de mandarlo al CRM o al webhook de n8n.
export function getAttributionFields(): Record<string, string> {
  const { hsa_params, ...rest } = getAttribution();
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(rest)) {
    if (typeof value === 'string' && value) fields[key] = value;
  }
  if (hsa_params) Object.assign(fields, hsa_params);
  return fields;
}

// Línea legible para anteponer a un campo de texto libre tipo `mensaje`,
// como respaldo por si el backend no tiene columnas propias para cada UTM.
export function getAttributionSummaryLine(): string | null {
  const a = getAttribution();
  const parts = [
    a.utm_source && `fuente: ${a.utm_source}`,
    a.utm_medium && `medio: ${a.utm_medium}`,
    a.utm_campaign && `campaña: ${a.utm_campaign}`,
    a.fbclid && 'vía Meta Ads',
    a.gclid && 'vía Google Ads',
  ].filter(Boolean);
  if (parts.length === 0) return null;
  return `Origen: ${parts.join(' · ')}`;
}
