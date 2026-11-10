import { lazy, Suspense, useCallback, useState } from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { VideoModal } from '@/components/ui/shared-landing-sections';
import { VIDEO_GRID, type VideoTestimonial } from '@/data/video-testimonials';
import { navigateTo } from '@/lib/utils';
import { AgencyVideoSkeleton } from '@/components/ui/agency-video-skeleton';

const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';
const FILTERS = ['Todos', 'Testimonios', 'Entrevistas'] as const;
// Filas completas sin desplegar: 6 hasta 3 columnas, 8 con 4 columnas.
const BASE_VIDEOS = 6;
const WIDE_VIDEOS = 8;
type Filter = (typeof FILTERS)[number];
const AgencyShowcaseMore = lazy(() => import('@/components/ui/agency-showcase-more'));

function VideoCard({ video, onPlay, visibility }: { video: VideoTestimonial; onPlay: () => void; visibility?: string }) {
  // Un vídeo privado o aún sin procesar no tiene miniatura: YouTube devuelve un
  // cuadro gris de 120 px. En su lugar se pinta una portada con la inmobiliaria;
  // cuando el vídeo sea público sale su foto sola.
  const [noThumb, setNoThumb] = useState(false);
  return (
    <li className={visibility}>
      <button
        type="button"
        onClick={onPlay}
        className={`group flex h-full w-full cursor-pointer flex-col overflow-hidden rounded-2xl bg-white text-left shadow-[0_6px_20px_rgba(0,0,0,0.08)] transition-[box-shadow,transform] duration-200 ${SNAPPY} active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2 [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)]`}
      >
        <span className="relative block aspect-video shrink-0 overflow-hidden bg-neutral-200">
          {/* Todos los vídeos miden lo mismo. hqdefault trae franjas negras: el recorte
              16:9 las quita. Los Shorts traen bandas borrosas a los lados: se amplían
              y se encuadra arriba para no cortar la cara. */}
          {noThumb && (
            <span className="absolute inset-0 flex flex-col items-start justify-end bg-[linear-gradient(135deg,#FF8000,#C2410C)] p-4 text-white">
              <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-white/80">Testimonio</span>
              <span className="mt-1 text-lg font-extrabold leading-tight tracking-tight md:text-xl">{video.agency}</span>
            </span>
          )}
          <img
            src={`https://img.youtube.com/vi/${video.id}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            decoding="async"
            width={480}
            height={360}
            onLoad={(e) => e.currentTarget.naturalWidth <= 120 && setNoThumb(true)}
            onError={() => setNoThumb(true)}
            className={`${noThumb ? 'hidden' : ''} h-full w-full object-cover transition-transform duration-300 ${SNAPPY} ${video.short ? 'origin-top scale-[1.34] object-top [@media(hover:hover)]:group-hover:scale-[1.4]' : '[@media(hover:hover)]:group-hover:scale-[1.03]'}`}
          />
          <span className="absolute right-2 bottom-2 flex size-9 items-center md:right-3 md:bottom-3 md:size-11 justify-center rounded-full bg-[#FF8000] text-white shadow-md">
            <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
          </span>
        </span>
        <span className="flex flex-1 flex-col p-3 md:p-4">
          <span className="line-clamp-3 min-h-[3.75em] text-[13px] font-bold leading-[1.25] tracking-tight text-black md:line-clamp-2 md:min-h-[2.5em] md:text-[15px]"><span className="sr-only">Ver vídeo: </span>{video.title}</span>
          <span className="mt-auto block truncate pt-1 text-xs text-neutral-600 md:text-[13px]">
            <span className="hidden md:inline">{video.who} · </span>
            {video.agency}
          </span>
        </span>
      </button>
    </li>
  );
}

// Muro de vídeos en tarjetas: filtro por tipo, cuadrícula uniforme y reproducción
// en ventana emergente. El reproductor de YouTube no se carga hasta el clic: aquí
// solo hay miniaturas. Se muestran dos filas y el resto se despliega con un botón.
// Con `agencyMedia` (home) el despliegue va en dos pasos: el primer "Ver más
// vídeos" saca el resto de YouTube y el segundo, en "Todos", los vídeos de las
// inmobiliarias del buscador (por lotes).
export function VideoGrid({ id = 'testimonios-title', titulo, acento, subtitulo, agencyMedia = false }: { id?: string; titulo?: string; acento?: string; subtitulo?: string; agencyMedia?: boolean } = {}) {
  const [filter, setFilter] = useState<Filter>('Todos');
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  // Segundo "Ver más vídeos" (solo home): tras los de YouTube, los de las inmobiliarias.
  const [showAgencies, setShowAgencies] = useState(false);
  const closeVideo = useCallback(() => setActiveVideo(null), []);
  // "Todos" deja fuera el vídeo que repite testimonio; sigue en su filtro.
  const videos = VIDEO_GRID.filter((v) => (filter === 'Todos' ? !v.repeat : v.category === filter));
  const visibilityOf = (index: number) => {
    if (showAll || index < BASE_VIDEOS) return undefined;
    return index < WIDE_VIDEOS ? 'hidden xl:block' : 'hidden';
  };

  return (
    <section aria-labelledby={id} className="bg-[#FFF8F1] px-5 py-10 md:px-10 md:py-16">
      <div className="mx-auto max-w-[82.5rem]">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 id={id} className="text-3xl font-extrabold leading-[1.1] tracking-tight text-black md:text-[2.75rem]">
              {titulo ?? 'Ellos ya trabajan con nosotros.'} <span className="block text-[#E67300]">{acento ?? 'Ahora es tu turno.'}</span>
            </h2>
            <p className="mt-3 text-base leading-relaxed text-neutral-600">
              {subtitulo ?? 'No te lo contamos nosotros: te lo cuentan las inmobiliarias.'}
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-2" role="group" aria-label="Filtrar vídeos">
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                aria-pressed={f === filter}
                className={`min-h-11 cursor-pointer rounded-full px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] sm:px-5 ${
                  f === filter ? 'bg-[#FF8000] text-white' : 'border border-neutral-300 bg-white text-black hover:border-black'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <ul className="mt-5 flex flex-wrap justify-center gap-3 md:mt-8 md:gap-5 [&>li]:w-[calc((100%-0.75rem)/2)] md:[&>li]:w-[calc((100%-1.25rem)/2)] lg:[&>li]:w-[calc((100%-2.5rem)/3)] xl:[&>li]:w-[calc((100%-3.75rem)/4)]">
          {videos.map((v, i) => (
            <VideoCard key={v.id} video={v} onPlay={() => setActiveVideo(v.id)} visibility={visibilityOf(i)} />
          ))}
        </ul>

        {agencyMedia && showAgencies && filter === 'Todos' && (
          <Suspense fallback={<AgencyVideoSkeleton />}>
            <AgencyShowcaseMore />
          </Suspense>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-3 md:mt-8">
          {agencyMedia && showAll && (
            <button
              type="button"
              onClick={() => {
                setShowAll(false);
                setShowAgencies(false);
              }}
              className="min-h-12 cursor-pointer rounded-lg border border-neutral-300 bg-white px-6 text-sm font-bold text-black transition-colors duration-150 hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300]"
            >
              Ver menos
            </button>
          )}
          {agencyMedia && showAll && !showAgencies && filter === 'Todos' && (
            <button
              type="button"
              onClick={() => setShowAgencies(true)}
              className="min-h-12 cursor-pointer rounded-lg border border-neutral-300 bg-white px-6 text-sm font-bold text-black transition-colors duration-150 hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300]"
            >
              Ver más vídeos
            </button>
          )}
          {!showAll && (agencyMedia || videos.length > BASE_VIDEOS) && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className={`min-h-12 cursor-pointer rounded-lg border border-neutral-300 bg-white px-6 text-sm font-bold text-black transition-colors duration-150 hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] ${agencyMedia || videos.length > WIDE_VIDEOS ? '' : 'xl:hidden'}`}
            >
              {agencyMedia ? 'Ver más vídeos' : `Ver los ${videos.length} vídeos`}
            </button>
          )}
          <a
            href="/nosotros"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/nosotros');
            }}
            className={`group inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#FF8000] px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#E67300] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
          >
            Conócenos
            <ArrowRight size={16} className={`transition-transform duration-200 ${SNAPPY} group-hover:translate-x-0.5`} aria-hidden="true" />
          </a>
        </div>
      </div>

      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideo} vertical={VIDEO_GRID.find((v) => v.id === activeVideo)?.short} />}
    </section>
  );
}
