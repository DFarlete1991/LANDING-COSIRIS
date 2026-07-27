import { supabase } from '@/lib/supabase';

type SiteAssetRow = {
  key: string;
  url: string | null;
};

// Trae el mapa de imágenes sitewide (fotos de ciudad, etc.) editadas por un
// admin desde el CRM (/dashboard/admin/imagenes → tabla site_assets). Nunca
// lanza — si Supabase no está configurado, la tabla no existe todavía o hay
// cualquier error, devuelve {} para que quien llame caiga a sus imágenes
// estáticas por defecto (ver src/data/city-images.ts).
export async function fetchLiveSiteAssets(): Promise<Record<string, string>> {
  if (!supabase) return {};

  try {
    const { data, error } = await supabase.from('site_assets').select('key, url');

    if (error || !data) {
      if (error) console.warn('[live-site-assets] No se pudieron leer las imágenes del sitio:', error.message);
      return {};
    }

    const map: Record<string, string> = {};
    for (const row of data as SiteAssetRow[]) {
      if (row.url) map[row.key] = row.url;
    }
    return map;
  } catch (err) {
    console.warn('[live-site-assets] Error inesperado leyendo las imágenes del sitio:', err);
    return {};
  }
}
