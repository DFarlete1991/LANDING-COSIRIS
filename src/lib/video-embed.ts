// El vídeo de una inmobiliaria puede venir como archivo subido (Cloudinary,
// se reproduce con <video src>) o como un enlace pegado a YouTube/Vimeo —
// un <video> normal no puede reproducir esos enlaces (son páginas web, no
// un archivo de vídeo), así que hay que detectarlos y usar un <iframe> con
// la URL de embed correcta. Cubre youtube.com/watch, youtu.be,
// youtube.com/shorts y vimeo.com.
export type VideoEmbed = { platform: 'youtube' | 'vimeo'; id: string; embedUrl: string } | null;

export function getVideoEmbed(url: string): VideoEmbed {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const host = parsed.hostname.replace(/^www\.|^m\./, '');

  if (host === 'youtube.com') {
    const fromQuery = parsed.searchParams.get('v');
    if (fromQuery) return { platform: 'youtube', id: fromQuery, embedUrl: `https://www.youtube.com/embed/${fromQuery}` };
    const [section, id] = parsed.pathname.split('/').filter(Boolean);
    if (['shorts', 'embed', 'live'].includes(section) && id) {
      return { platform: 'youtube', id, embedUrl: `https://www.youtube.com/embed/${id}` };
    }
    return null;
  }
  if (host === 'youtu.be') {
    const id = parsed.pathname.slice(1).split('/')[0];
    return id ? { platform: 'youtube', id, embedUrl: `https://www.youtube.com/embed/${id}` } : null;
  }
  if (host === 'vimeo.com') {
    const id = parsed.pathname.split('/').filter(Boolean)[0];
    return id ? { platform: 'vimeo', id, embedUrl: `https://player.vimeo.com/video/${id}` } : null;
  }
  return null;
}

// Un cliente puede haber pegado por error un link que no es ni YouTube/Vimeo
// ni un archivo de vídeo (por ejemplo, la URL de su propia página web) — eso
// no lo puede reproducir nadie, ni <video> ni un <iframe> de embed. Antes de
// intentar un <video src>, hay que confirmar que de verdad apunta a un
// archivo reproducible (subido a Cloudinary, o termina en una extensión de
// vídeo conocida).
export function isDirectVideoUrl(url: string): boolean {
  if (url.includes('cloudinary.com')) return true;
  return /\.(mp4|webm|ogg|mov|m3u8)(\?.*)?$/i.test(url);
}
