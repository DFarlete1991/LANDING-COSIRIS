import { useCallback, useState } from 'react';
import { Play } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { VideoModal } from '@/components/ui/shared-landing-sections';
import { SwipeRow } from '@/components/ui/swipe-row';
import { HOME_TESTIMONIALS, VIDEO_TESTIMONIALS } from '@/data/video-testimonials';

const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

// Los datos que Cosiris aún no ha rellenado van entre corchetes: nunca se
// pintan. Sin cita literal se muestra el título del vídeo (sin comillas).
const filled = (v: string) => !!v && !v.startsWith('[');
const videoTitle = (id: string) => VIDEO_TESTIMONIALS.find((v) => v.id === id)?.title ?? '';

// Testimonios de la home: fila deslizable en móvil y cuadrícula desde tablet. El
// reproductor de YouTube no se carga hasta el clic: aquí solo hay miniaturas.
export function VideoTestimonials() {
  const { openContactModal } = useUI();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  return (
    <>
      <SwipeRow
        label="Testimonios de inmobiliarias"
        arrowsClassName="md:hidden"
        className="-mx-5 scroll-pl-5 px-5 md:mx-0 md:grid md:grid-cols-2 md:gap-4 md:overflow-visible md:px-0 xl:grid-cols-4 md:[&>li]:w-auto md:[&>li]:max-w-none"
      >
        {HOME_TESTIMONIALS.map((t) => (
          <li key={t.id}>
            <article className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
              <button
                type="button"
                onClick={() => setActiveVideo(t.id)}
                aria-label={`Haz clic para escuchar el testimonio de ${t.company}`}
                className={`group relative block ${t.short ? 'aspect-[9/16]' : 'aspect-video'} w-full shrink-0 cursor-pointer overflow-hidden bg-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#E67300]`}
              >
                {/* hqdefault es 4:3 con franjas negras: el recorte 16:9 ya las elimina. */}
                <img
                  src={`https://img.youtube.com/vi/${t.id}/hqdefault.jpg`}
                  alt={`Testimonio de ${t.company}`}
                  loading="lazy"
                  decoding="async"
                  width={480}
                  height={360}
                  className={`h-full w-full object-cover transition-transform duration-300 ${SNAPPY} ${t.short ? 'scale-[1.32] [@media(hover:hover)]:group-hover:scale-[1.38]' : '[@media(hover:hover)]:group-hover:scale-[1.03]'}`}
                />
                <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full bg-black/80 px-3 py-1.5 text-xs font-bold text-white">
                  <Play size={12} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                  Haz clic para escuchar
                </span>
              </button>

              <div className="flex flex-1 flex-col p-4 md:p-5">
                <p className="text-xs font-bold text-[#C2410C]">
                  {filled(t.zone) ? `${t.kind} · ${t.zone}` : t.kind}
                </p>
                {filled(t.person) ? (
                  <>
                    <p className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight">{t.person}</p>
                    <p className="mt-0.5 text-sm text-neutral-600">{t.company}</p>
                  </>
                ) : (
                  <p className="mt-1.5 text-lg font-extrabold leading-tight tracking-tight">{t.company}</p>
                )}
                {t.results.some(filled) && (
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {t.results.filter(filled).map((r) => (
                      <li key={r} className="rounded-full bg-[#FFF0E5] px-2.5 py-1 text-xs font-bold text-[#C2410C]">
                        {r}
                      </li>
                    ))}
                  </ul>
                )}
                {filled(t.quote) ? (
                  <p className="mt-3 mb-4 border-t border-neutral-200 pt-3 text-[15px] font-semibold italic leading-snug">“{t.quote}”</p>
                ) : videoTitle(t.id) ? (
                  <p className="mt-3 mb-4 border-t border-neutral-200 pt-3 text-[15px] font-semibold leading-snug">{videoTitle(t.id)}</p>
                ) : (
                  <div className="mb-4" />
                )}
                <button
                  type="button"
                  onClick={() => openContactModal({ sourceContext: 'home_testimonios' })}
                  className={`mt-auto min-h-12 w-full cursor-pointer rounded-lg bg-[#FF8000] px-4 text-sm font-bold text-white transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#E67300] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
                >
                  Solicitar más información
                </button>
              </div>
            </article>
          </li>
        ))}
      </SwipeRow>

      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideo} vertical={HOME_TESTIMONIALS.find((t) => t.id === activeVideo)?.short} />}
    </>
  );
}
