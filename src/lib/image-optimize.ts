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

// Pedir solo `width` (sin `height`) hace que Supabase NO escale
// proporcionalmente: deja el otro lado en su tamaño original y solo achica
// el que se pidió (ej. una foto cuadrada de 200x200 con `width=100` vuelve
// como 100x200, no 100x100). Eso descuadra el recorte que hace el CSS
// (object-cover + el foto_pos/logo_pos guardado por cada inmobiliaria), que
// asume el aspecto original — de ahí fotos que se ven "cortadas" (solo se ve
// el mentón, etc.). Por eso siempre se pide `width` Y `height` iguales, con
// `resize=contain`: Supabase solo achica proporcionalmente dentro de esa caja
// sin recortar nada, y el recorte visual lo sigue haciendo el CSS de siempre.
export function optimizedImageUrl(
  url: string | null | undefined,
  maxDimension: number,
  quality = 82,
): string | undefined {
  if (!url) return undefined;
  const idx = url.indexOf(SUPABASE_STORAGE_OBJECT_PATH);
  if (idx === -1) return url;

  const base = url.slice(0, idx);
  const rest = url.slice(idx + SUPABASE_STORAGE_OBJECT_PATH.length);
  return `${base}${SUPABASE_STORAGE_RENDER_PATH}${rest}?width=${maxDimension}&height=${maxDimension}&resize=contain&quality=${quality}`;
}
