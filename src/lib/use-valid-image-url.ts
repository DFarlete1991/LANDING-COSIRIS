import { useEffect, useState } from 'react';

// Cache a nivel de módulo: si una URL ya falló una vez (ej. la cuenta de
// Cloudinary que aloja las fotos está caída), no hace falta reintentarla en
// cada tarjeta/avatar que la use en la misma sesión.
const brokenUrls = new Set<string>();

/**
 * Devuelve la URL solo si la imagen carga de verdad, o null si falla (403/404/
 * cuenta de hosting caída, etc.) — así el resto del componente puede seguir
 * usando su misma cadena de fallback (`foto_url ?? logo_url ?? inicial`) sin
 * mostrar el ícono de imagen rota cuando la URL existe pero no responde.
 */
export function useValidImageUrl(url: string | null | undefined): string | null {
  const [broken, setBroken] = useState(() => !!url && brokenUrls.has(url));

  useEffect(() => {
    setBroken(!!url && brokenUrls.has(url));
    if (!url || brokenUrls.has(url)) return;

    let cancelled = false;
    const img = new Image();
    img.onerror = () => {
      if (cancelled) return;
      brokenUrls.add(url);
      setBroken(true);
    };
    img.src = url;

    return () => {
      cancelled = true;
    };
  }, [url]);

  return url && !broken ? url : null;
}
