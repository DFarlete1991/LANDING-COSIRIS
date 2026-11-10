import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, X } from 'lucide-react';
import { InmobiliariasProvider, useInmobiliarias } from '@/context/InmobiliariasContext';
import { getVideoEmbed, isDirectVideoUrl } from '@/lib/video-embed';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { AGENCY_VIDEO_GRID as GRID, AgencyVideoSkeleton } from '@/components/ui/agency-video-skeleton';

// Vídeos de las inmobiliarias del buscador, para el "Ver más vídeos" de la
// home. Se carga solo al pulsar el botón: la home no descarga el directorio si
// nadie lo pide. Aquí son vídeos para ver, no enlaces a la ficha: al pulsar se
// abren en grande con sonido.

const hasVideo = (a: InmobiliariaPublica) =>
  !!a.media_presentacion_url && (!!getVideoEmbed(a.media_presentacion_url) || isDirectVideoUrl(a.media_presentacion_url));

function AgencyVideoModal({ agency, onClose }: { agency: InmobiliariaPublica; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const url = agency.media_presentacion_url ?? '';
  const embed = getVideoEmbed(url);
  return (
    <div role="dialog" aria-modal="true" aria-label={`Vídeo de ${agency.nombre_comercial}`} className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative aspect-[9/16] w-full max-w-[min(24rem,calc(85svh*0.5625))] overflow-hidden rounded-xl bg-black shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {embed ? (
          <iframe
            className="h-full w-full"
            src={embed.platform === 'youtube' ? `${embed.embedUrl}?autoplay=1&rel=0&playsinline=1` : `${embed.embedUrl}?autoplay=1`}
            title={`Vídeo de ${agency.nombre_comercial}`}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <video className="h-full w-full object-contain" src={url} controls autoPlay playsInline />
        )}
        <button type="button" onClick={onClose} aria-label="Cerrar vídeo" className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

// Misma tarjeta que los vídeos de YouTube del muro (ver video-grid.tsx): imagen
// 16:9 con el botón naranja y, debajo, el nombre y la población.
function AgencyVideoCard({ agency, onPlay, index }: { agency: InmobiliariaPublica; onPlay: () => void; index: number }) {
  const url = agency.media_presentacion_url ?? '';
  const embed = getVideoEmbed(url);
  // La portada sale del propio vídeo (nunca la foto de perfil, que parecería
  // una fotografía y no un vídeo).
  const thumb = embed?.platform === 'youtube' ? `https://img.youtube.com/vi/${embed.id}/hqdefault.jpg` : null;
  return (
    // Entrada escalonada: cada tarjeta sube y aparece 40 ms después de la anterior
    // (tope de 0,5 s para que las últimas no se hagan esperar).
    <motion.li
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1], delay: Math.min(index * 0.04, 0.5) }}
    >
      <button
        type="button"
        onClick={onPlay}
        aria-label={`Ver vídeo de ${agency.nombre_comercial}`}
        className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-[box-shadow,transform] duration-200 ${SNAPPY} active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)]`}
      >
        <span className="relative block aspect-video shrink-0 overflow-hidden bg-neutral-200">
          {thumb ? (
            <img src={thumb} alt="" loading="lazy" decoding="async" className={`h-full w-full object-cover object-[50%_30%] transition-transform duration-300 ${SNAPPY} [@media(hover:hover)]:group-hover:scale-[1.03]`} />
          ) : embed ? null : (
            // Archivo de vídeo: un fotograma del principio hace de portada.
            <video src={`${url}#t=3`} preload="metadata" muted playsInline className="h-full w-full object-cover object-[50%_30%]" />
          )}
          <span className="absolute right-2 bottom-2 flex size-9 items-center justify-center rounded-full bg-[#FF8000] text-white shadow-md md:right-3 md:bottom-3 md:size-11">
            <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
          </span>
        </span>
        <span className="flex flex-1 flex-col p-3 md:p-4">
          <span className="line-clamp-3 min-h-[3.75em] text-[13px] font-bold leading-[1.25] tracking-tight text-black md:line-clamp-2 md:min-h-[2.5em] md:text-[15px]">{agency.nombre_comercial.trim()}</span>
          <span className="mt-auto block truncate pt-1 text-xs text-neutral-600 md:text-[13px]">{agency.poblacion?.trim() ? `Vídeo · ${agency.poblacion.trim()}` : 'Vídeo'}</span>
        </span>
      </button>
    </motion.li>
  );
}

// Se cargan por lotes de 8 (dos filas en escritorio): el siguiente lote entra
// al acercarse al final, así no se piden todos los vídeos de golpe.
const BATCH = 8;

function Cards() {
  const { agencies, loading } = useInmobiliarias();
  const withVideo = useMemo(() => agencies.filter(hasVideo), [agencies]);
  const [playing, setPlaying] = useState<InmobiliariaPublica | null>(null);
  const [shown, setShown] = useState(BATCH);
  const sentinel = useRef<HTMLDivElement>(null);
  const hasMore = shown < withVideo.length;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasMore) return;
    const io = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && setShown((n) => n + BATCH),
      { rootMargin: '0px 0px 200px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, shown]);

  // Mientras llega el directorio real no se enseñan los datos de ejemplo.
  if (loading) return <AgencyVideoSkeleton />;
  if (!withVideo.length) return null;
  // Misma rejilla que los shorts de arriba (2 / 3 / 4 columnas y mismo hueco).
  return (
    <>
      <ul className={`mt-3 md:mt-5 ${GRID}`}>
        {withVideo.slice(0, shown).map((agency, i) => (
          <AgencyVideoCard key={agency.id} index={i % BATCH} agency={agency} onPlay={() => setPlaying(agency)} />
        ))}
      </ul>
      {hasMore && (
        <div ref={sentinel}>
          <AgencyVideoSkeleton />
        </div>
      )}
      {playing && <AgencyVideoModal agency={playing} onClose={() => setPlaying(null)} />}
    </>
  );
}

// Se despliegan debajo de los shorts, sin caja con scroll propio. "Ver menos"
// está justo debajo.
export default function AgencyShowcaseMore() {
  return (
    <InmobiliariasProvider>
      <Cards />
    </InmobiliariasProvider>
  );
}
