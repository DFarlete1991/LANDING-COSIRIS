// Las fotos/logos de las inmobiliarias se suben tal cual al bucket público de
// Supabase Storage (algunas de varios MB) — a diferencia de Cloudinary, que
// se usaba antes, Storage no redimensiona nada por su cuenta. El proyecto sí
// tiene habilitado el endpoint de transformación de imágenes de Supabase
// (/render/image/public/... en vez de /object/public/...), así que en vez de
// servir el original se pide siempre una versión ya redimensionada al tamaño
// real en el que se va a pintar. Si la URL no es de Supabase Storage (logo
// externo de la propia web de la inmobiliaria, etc.) se devuelve intacta.
const SUPABASE_STORAGE_OBJECT_PATH = '/storage/v1/object/public/';
const SUPABASE_STORAGE_RENDER_PATH = '/storage/v1/render/image/public/';

export function optimizedImageUrl(
  url: string | null | undefined,
  width: number,
  quality = 82,
): string | undefined {
  if (!url) return undefined;
  const idx = url.indexOf(SUPABASE_STORAGE_OBJECT_PATH);
  if (idx === -1) return url;

  const base = url.slice(0, idx);
  const rest = url.slice(idx + SUPABASE_STORAGE_OBJECT_PATH.length);
  return `${base}${SUPABASE_STORAGE_RENDER_PATH}${rest}?width=${width}&quality=${quality}`;
}
