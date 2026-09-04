import { lazy, Suspense, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';
import {
  ArrowLeft, BadgeCheck, Building2, Check, ChevronLeft, ChevronRight, Copy, Home, LayoutGrid, MapPin, MapPinned,
  MessageCircle, Pause, Phone, Play, ShieldCheck, Star, User, Users, Volume2, VolumeX, Wallet, Briefcase, Zap, X,
} from 'lucide-react';
import { Footer } from '../Footer';
import { AgencyLeadForm, type TipoInmueble } from '../ui/AgencyLeadForm';
import { AgencyMap } from '../ui/AgencyMap';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { REVIEWS_PLACEHOLDER } from '@/data/reviews-placeholder';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { navigateTo, getLastDirectoryUrl } from '@/lib/utils';
import { findAgencyByProfilePath, humanizeCitySlug, agencyProfilePath, NO_CITY_SLUG } from '@/lib/agency-url';
import { useSEO } from '@/lib/seo';
import { fetchPlaceReviews, type GoogleReview } from '@/lib/google-places';
import { optimizedImageUrl } from '@/lib/image-optimize';
import { FadeImage } from '../ui/FadeImage';
import { fetchResenasManuales, type ResenaManual } from '@/data/live-resenas';
import { getVideoEmbed, isDirectVideoUrl } from '@/lib/video-embed';
import { useValidImageUrl } from '@/lib/use-valid-image-url';

// three.js + fiber pesan varios cientos de KB — nada de esto debe entrar en
// el bundle inicial de una landing de campaña de pago. Se carga solo si el
// visitante entra en desktop (ver `show3D` más abajo), y ni siquiera
// entonces hasta que React decide pintarlo.
const LocationGlobe = lazy(() => import('../ui/LocationGlobe'));

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

/** Igual que el `useInView` independiente de framer-motion (no el prop
    `whileInView` de `motion.*`, que sí funciona bien en el resto de la
    página), pero sin IntersectionObserver: tanto el de la librería como uno
    propio con IntersectionObserver se comportaban de forma intermitente en
    esta página — a veces detectaba la intersección y a veces se quedaba
    pegado en `false` para siempre, con el mismo nodo, el mismo margen y el
    elemento ya visible en pantalla (reproducido incluso en build de
    producción). Comprobar la posición a mano en cada scroll es más simple y,
    para algo que solo necesita dispararse una vez, deja de depender de esa
    intermitencia. */
function useEnteredViewport(ref: RefObject<HTMLElement | null>, marginPx: number): boolean {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    if (entered) return;
    const check = () => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight + marginPx && rect.bottom >= -marginPx) setEntered(true);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [ref, entered, marginPx]);
  return entered;
}

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M€`;
  if (price >= 1000) return `${Math.round(price / 1000)}k€`;
  return `${price}€`;
}

function excerpt(text: string, max = 168): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function ProofStrip({ agency }: { agency: InmobiliariaPublica }) {
  const stats = [
    { icon: Home, value: String(agency.num_propiedades), label: 'PROPIEDADES VENDIDAS', raw: agency.num_propiedades },
    { icon: Wallet, value: formatPrice(agency.precio_medio), label: 'PRECIO MEDIO', raw: agency.precio_medio },
    { icon: Briefcase, value: String(agency.anos_experiencia), label: 'AÑOS DE EXPERIENCIA', raw: agency.anos_experiencia },
    { icon: Users, value: String(agency.num_empleados), label: 'EQUIPO', raw: agency.num_empleados },
  ].filter((s) => s.raw > 0);

  return (
    <div className="flex flex-wrap gap-4">
      {stats.map(({ icon: Icon, value, label }) => (
        <div key={label} className="min-w-[150px] flex-1 rounded-card border border-border bg-white px-6 py-4 shadow-soft">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
              <Icon size={18} />
            </div>
            <div>
              <p className="text-xl font-black leading-none text-foreground sm:text-2xl">{value}</p>
              <p className="mt-1 text-caption font-medium leading-tight text-ink-muted">{label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const WHY_US = [
  { icon: MessageCircle, title: 'Trato directo, sin intermediarios' },
  { icon: MapPinned, title: 'Conocemos tu zona al detalle' },
  { icon: Zap, title: 'Respuesta rápida' },
  { icon: ShieldCheck, title: 'Verificados por Cosiris' },
];

/** Versión compacta de "por qué elegirnos": antes era una sección aparte con
    titular grande y 4 tarjetas altas (mucho scroll para poco contenido
    accionable). Ahora es una sola franja de iconos + etiqueta corta, para no
    robarle atención (ni altura de página) a las secciones que sí convierten.
    El cliente puede apagarla del todo desde el CRM (`mostrar_diferenciales`,
    ver InmobiliariaPerfilPage → agency.mostrar_diferenciales). */
function DifferentiatorsStrip() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, ease: [0.19, 1, 0.22, 1] }}
      className="flex snap-x gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
    >
      {WHY_US.map(({ icon: Icon, title }) => (
        <div
          key={title}
          className="flex shrink-0 snap-start items-center gap-3 rounded-2xl border border-[#ECE8E1] bg-white px-4 py-3.5 shadow-[0_6px_20px_rgba(30,35,50,.04)] sm:shrink"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
            <Icon size={16} />
          </div>
          <p className="whitespace-nowrap text-sm font-semibold text-[#0F172A] sm:whitespace-normal">{title}</p>
        </div>
      ))}
    </motion.div>
  );
}

type VideoOrientation = 'horizontal' | 'vertical' | null;

// Para un embed (YouTube/Vimeo) no hay forma de leer las dimensiones reales
// del vídeo sin llamar a su API oEmbed — a diferencia de un <video> propio,
// donde el navegador ya conoce el tamaño real vía onLoadedMetadata. Sin
// esto, un Short/Reel vertical quedaría forzado en una caja horizontal
// 16:9 con franjas negras enormes arriba y abajo.
async function fetchEmbedOrientation(embed: { platform: 'youtube' | 'vimeo'; id: string }): Promise<VideoOrientation> {
  try {
    const oembedUrl = embed.platform === 'youtube'
      ? `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${embed.id}`)}&format=json`
      : `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(`https://vimeo.com/${embed.id}`)}`;
    const res = await fetch(oembedUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.width !== 'number' || typeof data.height !== 'number' || !data.width || !data.height) return null;
    return data.height > data.width ? 'vertical' : 'horizontal';
  } catch {
    return null;
  }
}

function VideoCard({
  url,
  nombre,
  logoUrl,
  logoPos,
  posterUrl,
  onError,
}: {
  url: string;
  nombre: string;
  logoUrl?: string | null;
  logoPos?: string | null;
  posterUrl?: string | null;
  onError?: () => void;
}) {
  const resolvedLogoUrl = useValidImageUrl(logoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  // Si la visita pausa a propósito, el autoplay del IntersectionObserver de
  // abajo no debe reanudarlo solo por seguir (o volver a estar) en pantalla.
  const manuallyPausedRef = useRef(false);
  const embed = useMemo(() => getVideoEmbed(url), [url]);
  // null mientras se detecta (o si no se pudo saber) — de momento se trata
  // como horizontal, el caso más común, hasta que llegue la respuesta.
  const [orientation, setOrientation] = useState<VideoOrientation>(null);

  useEffect(() => {
    setOrientation(null);
    if (!embed) return;
    let cancelled = false;
    fetchEmbedOrientation(embed).then((o) => { if (!cancelled) setOrientation(o); });
    return () => { cancelled = true; };
  }, [embed]);

  // Se reproduce solo (en silencio, como un Reel) en cuanto entra en
  // pantalla, y se pausa al salir — así no se gasta ancho de banda de fondo
  // en un vídeo que nadie está viendo. El sonido lo activa quien quiera con
  // el botón; los navegadores bloquean el autoplay con sonido de todas
  // formas, así que arrancar silenciado no es opcional.
  useEffect(() => {
    if (embed) return;
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!manuallyPausedRef.current) videoRef.current?.play().catch(() => {});
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [embed]);

  const isVertical = orientation === 'vertical';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
    >
      <div className="mb-5">
        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Conócenos</span>
        <h3 className="mt-1 text-2xl font-bold text-[#0F172A] sm:text-[26px]">Video de presentación</h3>
      </div>

      <div className="rounded-[24px] border border-border bg-white p-3 shadow-[0_10px_30px_rgba(15,23,42,.06)]">
        {embed ? (
          <div className={`mx-auto overflow-hidden rounded-[16px] bg-black ${isVertical ? 'aspect-[9/16] w-full max-w-[300px]' : 'aspect-video w-full max-w-[640px]'}`}>
            <iframe
              src={`${embed.embedUrl}?rel=0`}
              title={`Vídeo de presentación de ${nombre}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        ) : (
          <div ref={containerRef} className="relative mx-auto w-fit max-w-full overflow-hidden rounded-[16px] bg-black">
            <video
              ref={videoRef}
              muted={muted}
              loop
              playsInline
              // La caja de este video se ajusta sola por CSS (ancho
              // automático, alto tope) según su tamaño real -- sin adivinar
              // la orientación de antemano.
              preload="metadata"
              poster={posterUrl ? optimizedImageUrl(posterUrl, 640) : undefined}
              className="block max-h-[70vh] w-auto max-w-full object-contain sm:max-h-[560px] sm:max-w-[640px]"
              src={url}
              onError={onError}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {!isPlaying && (
              <button
                type="button"
                onClick={() => {
                  manuallyPausedRef.current = false;
                  videoRef.current?.play().catch(() => {});
                }}
                aria-label="Reproducir"
                className="absolute inset-0 flex items-center justify-center"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-primary shadow-lg transition-transform duration-200 hover:scale-105">
                  <Play size={26} className="ml-1" fill="currentColor" />
                </span>
              </button>
            )}

            {isPlaying && (
              <button
                type="button"
                onClick={() => {
                  manuallyPausedRef.current = true;
                  videoRef.current?.pause();
                }}
                aria-label="Pausar"
                className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 active:scale-90"
              >
                <Pause size={17} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Activar sonido' : 'Silenciar'}
              aria-pressed={!muted}
              className="absolute bottom-3 right-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-sm transition-all duration-200 hover:bg-black/65 active:scale-90"
            >
              {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </button>
          </div>
        )}
      </div>

      {resolvedLogoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="relative z-10 -mb-8 mt-5 flex justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg shadow-slate-900/10">
            <FadeImage
              src={optimizedImageUrl(resolvedLogoUrl, 130)}
              alt={nombre}
              style={{ objectPosition: logoPos ?? '50% 50%' }}
              className="h-full w-full rounded-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
        className={`flex items-center gap-3 rounded-[22px] border border-[#ECE8E1] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(30,35,50,.05)] ${resolvedLogoUrl ? 'pt-9' : 'mt-5'}`}
      >
        {!resolvedLogoUrl && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
            <ShieldCheck size={18} />
          </div>
        )}
        <div className={resolvedLogoUrl ? 'w-full text-center' : ''}>
          <p className="text-sm font-bold text-[#0F172A]">Transparencia, compromiso y resultados comprobados.</p>
          <p className="text-xs text-[#68707F]">Así trabajamos en {nombre}.</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Reseñas — contenido de muestra (ver @/data/reviews-placeholder), usado
    solo cuando la inmobiliaria no tiene ni google_place_id ni reseñas
    manuales cargadas desde el CRM. */
const REVIEWS_PLACEHOLDER_EXPANDED = REVIEWS_PLACEHOLDER;

type DisplayReview = {
  key: string | number;
  autor: string;
  rating: number;
  comentario: string;
  fecha: string;
  avatarUrl?: string;
};

function ReviewMiniCard({ review, paused, reducedMotion }: { review: DisplayReview; paused: boolean; reducedMotion: boolean }) {
  return (
    <div className="group overflow-hidden rounded-[24px] border border-[#ECE8E1] bg-white p-6 shadow-[0_8px_28px_rgba(24,35,52,.04)]">
      <motion.div
        initial={{ scale: 1 }}
        animate={{ scale: paused || reducedMotion ? 1 : 1.03 }}
        transition={{ duration: 3.9, ease: 'easeOut', delay: 0.6 }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/8 text-primary">
              {review.avatarUrl ? (
                <img src={review.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User size={16} />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-lg font-semibold text-[#0F172A]">{review.autor}</p>
            </div>
          </div>
          <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
            {review.fecha}
          </span>
        </div>

        <p className="mt-3 text-sm leading-[160%] text-[#68707F]">&ldquo;{review.comentario}&rdquo;</p>

        <div className="mt-3 flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star
              key={s}
              size={15}
              className={s < review.rating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#E2DCD3]'}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

/** Carrusel tipo ruleta vertical para cuando hay más de 3 reseñas: cada
    par entra desde abajo, hace un pequeño zoom mientras se muestra y
    después sube para dejar paso al siguiente par. Se queda estático al
    pasar el cursor (o al tocarlo en móvil). */
function ReviewsCarousel({ reviews }: { reviews: DisplayReview[] }) {
  const PAGE_SIZE = 2;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [wasTouched, setWasTouched] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const isTouch =
    typeof window !== 'undefined' &&
    ((typeof window.matchMedia === 'function' && window.matchMedia('(hover: none)').matches) || navigator.maxTouchPoints > 0);

  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.2 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Avanza de dos en dos — si al par le toca un impar de vuelta (número de
  // reseñas impar), el último "par" del ciclo se queda en una sola tarjeta
  // en vez de repetir la primera para completar el hueco.
  const pair = index + 1 < reviews.length ? [reviews[index], reviews[index + 1]] : [reviews[index]];
  const nextPageIndex = (i: number) => (i + PAGE_SIZE >= reviews.length ? 0 : i + PAGE_SIZE);
  const prevPageIndex = (i: number) => (i - PAGE_SIZE < 0 ? Math.max(reviews.length - (reviews.length % PAGE_SIZE || PAGE_SIZE), 0) : i - PAGE_SIZE);

  // Avanza la ruleta solo si está visible, no está en pausa y el usuario no ha
  // interactuado con ella. En táctil, en cuanto se toca, queda estática.
  useEffect(() => {
    if (reducedMotion || paused || !inView || (isTouch && wasTouched)) return;
    const t = setTimeout(() => {
      setIndex((i) => (i + PAGE_SIZE >= reviews.length ? 0 : i + PAGE_SIZE));
    }, 4600);
    return () => clearTimeout(t);
  }, [reducedMotion, paused, inView, isTouch, wasTouched, index, reviews.length]);

  const goPrev = () => {
    setPaused(true);
    setIndex(prevPageIndex);
  };

  const goNext = () => {
    setPaused(true);
    setIndex(nextPageIndex);
  };

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => { setPaused(true); setWasTouched(true); }}
      onTouchEnd={() => setPaused(false)}
      className="relative"
      aria-roledescription="carrusel"
      aria-label="Reseñas de clientes"
    >
      <div className="min-h-[300px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pair.map((r) => r.key).join('-')}
            initial={{ y: 84, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -84, opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="grid grid-cols-1 gap-4"
          >
            {pair.map((review) => (
              <ReviewMiniCard key={review.key} review={review} paused={paused} reducedMotion={reducedMotion} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Ver comentario anterior"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/35 bg-white text-primary shadow-[0_6px_20px_rgba(255,128,0,0.22)] transition-all duration-200 hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_10px_28px_rgba(255,128,0,0.45)] active:scale-90"
        >
          <ChevronLeft size={19} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Ver comentario siguiente"
          className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary/35 bg-white text-primary shadow-[0_6px_20px_rgba(255,128,0,0.22)] transition-all duration-200 hover:border-primary hover:bg-primary hover:text-white hover:shadow-[0_10px_28px_rgba(255,128,0,0.45)] active:scale-90"
        >
          <ChevronRight size={19} />
        </button>
      </div>
    </div>
  );
}

function ReviewsList({ agency }: { agency: InmobiliariaPublica }) {
  const [googleReviews, setGoogleReviews] = useState<GoogleReview[] | null>(null);
  const [manualReviews, setManualReviews] = useState<ResenaManual[] | null>(null);
  const [loading, setLoading] = useState(false);
  // fetchPlaceReviews usa la librería JS de Places (no un fetch() directo, que
  // Google bloquea por CORS desde el navegador) — necesita el script de Maps
  // ya cargado antes de poder pedir la ficha del negocio.
  const { isLoaded: mapsLoaded } = useJsApiLoader(googleMapsLoaderOptions);

  // Prioridad: Google (si hay google_place_id) > reseñas escritas a mano
  // desde el CRM > placeholder de ejemplo — ver CRM: Perfil > Directorio
  // público > Reseñas de clientes, donde el cliente elige una de las dos
  // primeras opciones (o ninguna, y se queda en el placeholder).
  useEffect(() => {
    if (agency.google_place_id) {
      if (!mapsLoaded) return;
      setLoading(true);
      fetchPlaceReviews(agency.google_place_id).then((result) => {
        if (result?.reviews?.length) setGoogleReviews(result.reviews);
        setLoading(false);
      });
      return;
    }
    setLoading(true);
    fetchResenasManuales(agency.id).then((rows) => {
      if (rows.length > 0) setManualReviews(rows);
      setLoading(false);
    });
  }, [agency.google_place_id, agency.id, mapsLoaded]);

  const source: 'google' | 'manual' | 'placeholder' = googleReviews ? 'google' : manualReviews ? 'manual' : 'placeholder';

  // Solo se muestran las reseñas de 5 estrellas — la idea es dar buena imagen,
  // no un resumen representativo de todas las opiniones recibidas.
  const reviews: DisplayReview[] = (
    source === 'google'
      ? googleReviews!.map((r, i) => ({
          key: i, autor: r.author_name, rating: r.rating, comentario: r.text,
          fecha: r.relative_time_description, avatarUrl: r.profile_photo_url,
        }))
      : source === 'manual'
        ? manualReviews!.map((r) => ({
            key: r.id, autor: r.autor_nombre, rating: r.rating, comentario: r.comentario,
            fecha: new Date(r.created_at).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }),
          }))
        : REVIEWS_PLACEHOLDER_EXPANDED.map((r) => ({
            key: r.id, autor: r.autor, rating: r.rating, comentario: r.comentario, fecha: r.fecha,
          }))
  ).filter((r) => r.rating === 5);

  // Sin reseñas de 5 estrellas que mostrar, mejor ocultar toda la sección
  // (título incluido) que dejar un bloque "Lo que dicen de nosotros" vacío.
  if (!loading && reviews.length === 0) return null;

  // El carrusel entra no solo cuando hay muchas reseñas, sino también cuando
  // pocas (2-3) son tan largas juntas que la columna quedaría mucho más alta
  // que el mapa de al lado — se estima por longitud de texto combinada, ya
  // que es lo que determina la altura real de las tarjetas apiladas.
  const combinedLength = reviews.reduce((sum, r) => sum + r.comentario.length, 0);
  const useCarousel = reviews.length > 3 || (reviews.length > 1 && combinedLength > 600);

  return (
    <div className="flex w-full flex-col">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          <motion.span
            aria-hidden="true"
            animate={prefersReducedMotion() ? {} : { y: [0, -1.5, 0], rotate: [0, -7, 7, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex shrink-0"
          >
            <MessageCircle size={15} />
          </motion.span>
          Reseñas de clientes
        </span>
        <h3 className="mt-4 text-[42px] font-bold leading-[110%] tracking-[-0.02em] text-[#0F172A]">
          Lo que dicen de nosotros
        </h3>
        <p className="mt-3 text-lg leading-[170%] text-[#68707F]">
          {source === 'google' ? 'Opiniones verificadas de Google' : 'La confianza de quienes ya han vendido con nosotros.'}
        </p>

        {/* Cifras propias justo junto a las reseñas — refuerzan la prueba
            social con datos concretos en vez de dejar que las reseñas
            trabajen solas. Solo se muestran los campos que la inmobiliaria
            haya rellenado en el CRM (>0). */}
        <div className="mt-6 flex flex-wrap gap-3">
          {agency.num_propiedades > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ECE8E1] bg-white px-4 py-2 text-sm shadow-[0_4px_16px_rgba(24,35,52,.04)]">
              <Home size={14} className="text-primary" />
              <span className="font-bold text-[#0F172A]">{agency.num_propiedades}</span>
              <span className="text-[#68707F]">viviendas vendidas</span>
            </div>
          )}
          {agency.anos_experiencia > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ECE8E1] bg-white px-4 py-2 text-sm shadow-[0_4px_16px_rgba(24,35,52,.04)]">
              <Briefcase size={14} className="text-primary" />
              <span className="font-bold text-[#0F172A]">{agency.anos_experiencia}</span>
              <span className="text-[#68707F]">años de experiencia</span>
            </div>
          )}
          {agency.precio_medio > 0 && (
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ECE8E1] bg-white px-4 py-2 text-sm shadow-[0_4px_16px_rgba(24,35,52,.04)]">
              <Wallet size={14} className="text-primary" />
              <span className="font-bold text-[#0F172A]">{formatPrice(agency.precio_medio)}</span>
              <span className="text-[#68707F]">precio medio</span>
            </div>
          )}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12 text-sm text-ink-muted">Cargando reseñas…</div>
      )}

      {!loading && useCarousel && !prefersReducedMotion() && (
        <div className="my-auto flex w-full flex-col">
          <ReviewsCarousel reviews={reviews} />
        </div>
      )}

      <div className="space-y-5">
        {!loading && (!useCarousel || prefersReducedMotion()) && reviews.map((review, i) => (
          <motion.div
            key={review.key}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.45, delay: Math.min(i * 0.1, 0.4), ease: [0.19, 1, 0.22, 1] }}
            className="group rounded-[24px] border border-[#ECE8E1] bg-white p-6 shadow-[0_8px_28px_rgba(24,35,52,.04)] transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(24,35,52,.1)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/8 text-primary">
                  {review.avatarUrl ? (
                    <img src={review.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <User size={16} />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-[#0F172A]">{review.autor}</p>
                </div>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                {review.fecha}
              </span>
            </div>

            <p className="mt-3 text-sm leading-[160%] text-[#68707F]">&ldquo;{review.comentario}&rdquo;</p>

            <div className="mt-3 flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, s) => (
                <Star
                  key={s}
                  size={15}
                  className={s < review.rating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#E2DCD3]'}
                />
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {source === 'google' && (
        <p className="mt-6 text-xs text-ink-faint text-center">
          Reseñas obtenidas de Google Places
        </p>
      )}
    </div>
  );
}

function LocationSection({ agency, searchPoint, displayCity }: { agency: InmobiliariaPublica; searchPoint: { lat: number; lng: number } | null; displayCity: string }) {
  if (agency.lat == null || agency.lng == null) return null;

  const location = { lat: agency.lat, lng: agency.lng };

  return (
    <div>
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">📍 Ubicación</span>

      <h3 className="mt-4 text-[48px] font-bold leading-[110%] tracking-[-0.02em] text-[#0F172A]">
        Estamos en {[displayCity, agency.provincia].filter(Boolean).join(', ')}
      </h3>

      <p className="mt-4 text-lg leading-[170%] text-[#68707F]">
        Conocemos cada rincón de la zona para ayudarte a vender mejor tu propiedad.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-sm font-semibold text-[#0F172A]">
        <span className="text-base">📍</span>
        Especialistas en {displayCity || 'tu zona'} y municipios cercanos
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
        className="relative mt-8 rounded-[32px] bg-white p-[18px] shadow-[0_18px_50px_rgba(24,35,52,.07)]"
      >
        <div className="relative h-[360px] overflow-hidden rounded-[24px]">
          <AgencyMap
            agencies={[agency]}
            searchPoint={searchPoint}
            center={[location.lat, location.lng]}
            zoom={14}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.19, 1, 0.22, 1] }}
          className="pointer-events-none absolute inset-x-[18px] bottom-[18px] flex h-[100px] items-center rounded-[24px] bg-white px-6 shadow-[0_15px_35px_rgba(25,35,50,.08)]"
        >
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-sm font-bold text-[#0F172A]">{displayCity || agency.provincia}</p>
                <p className="text-xs text-[#68707F]">Zona centro</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </div>
  );
}

const FAQ = [
  { q: '¿Cuánto vale realmente mi propiedad?', a: 'No existe un precio único. El valor real depende de la zona, las características concretas de la vivienda, su estado de conservación, la demanda actual y el precio de propiedades comparables vendidas recientemente. Analizamos todo esto para ofrecerte una horquilla realista, no una cifra inflada.' },
  { q: '¿Cómo calculan el precio recomendado?', a: 'Estudiamos el mercado local, comparamos con propiedades similares vendidas en los últimos meses y ajustamos la estrategia según el estado de la vivienda y los objetivos del propietario. El resultado es un precio pensado para vender en un plazo razonable, no para probar suerte.' },
  { q: '¿Cuánto se tarda normalmente en vender una vivienda?', a: 'Depende del precio de salida, la ubicación, la demanda en esa zona y las características del inmueble. Una vivienda bien valorada puede venderse en semanas; una sobrevalorada puede quedarse meses en el mercado. Nuestro trabajo es acertar con el precio desde el primer día.' },
  { q: '¿Cuánto cobran por vender una propiedad?', a: 'Los honorarios se acuerdan de forma transparente desde el principio y dependen del tipo de servicio que necesites. Te lo explicamos todo durante la primera visita, sin compromiso ni sorpresas.' },
  { q: '¿Tengo que vender mi propiedad en exclusiva?', a: 'No es obligatorio. Analizamos tu caso y te recomendamos la opción que mejor se adapte a tus objetivos. La exclusiva puede tener ventajas, pero la decisión siempre es tuya.' },
  { q: '¿Por qué debería confiar en Cosiris?', a: 'Porque conocemos la zona, trabajamos con datos reales y acompañamos al propietario en cada paso del proceso. Nuestra prioridad es que vendas con confianza, no con prisas.' },
];

function Accordion({ items }: { items: { q: string; a: string }[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
      <div className="space-y-2.5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-2 flex items-center gap-2 pl-1 text-[11px] font-medium text-[#FF8000]/70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 3L19 10L12 12L12 19L9 15L5 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          Haz clic en cada pregunta
        </motion.div>
        {items.map((item, i) => (
          <div key={item.q}>
            <motion.button
              type="button"
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.35, delay: i * 0.06, ease: [0.19, 1, 0.22, 1] }}
              className={`w-full rounded-xl border px-5 py-4 text-left text-body-sm font-semibold shadow-soft transition-all duration-200 ${
                openIndex === i
                  ? 'border-primary bg-primary text-white shadow-[0_8px_24px_rgba(255,128,0,0.25)]'
                  : 'border-border bg-white text-foreground hover:border-primary/30'
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                  openIndex === i ? 'bg-white/20 text-white' : 'bg-primary/8 text-primary'
                }`}>
                  {i + 1}
                </span>
                {item.q}
              </span>
            </motion.button>

            {/* Respuesta en línea, justo debajo de su pregunta — solo en
                móvil/tablet. En lg+ la respuesta va en el panel de la
                derecha (columna aparte), así que aquí se oculta. */}
            <AnimatePresence initial={false}>
              {openIndex === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                  className="overflow-hidden lg:hidden"
                >
                  <div className="mt-2.5 rounded-xl border border-border bg-white p-5 shadow-soft">
                    <div className="mb-3 h-1 w-10 rounded-full bg-primary" />
                    <p className="text-body-sm leading-[170%] text-ink-muted">{item.a}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      <div className="relative hidden min-h-[280px] items-center lg:flex lg:pl-4">
        <AnimatePresence mode="wait">
          {openIndex !== null ? (
            <motion.div
              key={items[openIndex].q}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
              className="w-full"
            >
              <div               className="rounded-card border border-border bg-white p-8 shadow-soft">
                <div className="mb-5 h-1 w-14 rounded-full bg-primary" />
                <p className="text-[17px] leading-[170%] text-ink-muted">
                  {items[openIndex].a}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="flex w-full flex-col items-center gap-8"
            >
              <div
                className="relative h-36 w-96 overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 18%, black 82%, transparent 100%)',
                }}
              >
                <motion.div
                  animate={{ x: [0, -144 * 5] }}
                  transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                  className="flex items-center gap-10 pl-10"
                >
                  {Array.from({ length: 14 }).map((_, i) => {
                    const colors = [
                      'bg-orange-50 text-primary',
                      'bg-amber-50 text-amber-600',
                      'bg-orange-100 text-orange-700',
                      'bg-yellow-50 text-yellow-600',
                      'bg-amber-100 text-amber-700',
                      'bg-orange-200/60 text-orange-600',
                    ];
                    return (
                      <div
                        key={i}
                        className={`flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl shadow-[0_6px_24px_rgba(255,128,0,0.12)] ${colors[i % colors.length]}`}
                        style={{ transform: `scale(${1 - Math.abs((i % 6) - 3) * 0.06})`, opacity: 1 - Math.abs((i % 6) - 3) * 0.08 }}
                      >
                        <Users size={40} />
                      </div>
                    );
                  })}
                </motion.div>
              </div>
              <p className="text-body-sm text-ink-muted">Selecciona una pregunta para ver la respuesta</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CtaButton({
  agency,
  showPhone,
  onOpenTypeSelector,
}: {
  agency: InmobiliariaPublica;
  showPhone: boolean;
  onOpenTypeSelector: () => void;
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(t);
  }, [copied]);

  const handleCopyPhone = async () => {
    try {
      await navigator.clipboard.writeText(agency.telefono);
      setCopied(true);
    } catch {
      // Clipboard API bloqueada (permisos, contexto no seguro) — nada que
      // recuperar aquí, el usuario aún puede copiar el número a mano.
    }
  };

  return showPhone ? (
    <button
      type="button"
      onClick={handleCopyPhone}
      className="flex w-fit items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:bg-primary-hover hover:shadow-card active:scale-[0.98]"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? '¡Copiado!' : agency.telefono}
    </button>
  ) : (
    <button
      type="button"
      onClick={onOpenTypeSelector}
      className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:bg-primary-hover hover:shadow-card active:scale-[0.98]"
    >
      <Phone size={14} /> Solicitar valoración
    </button>
  );
}

const PROPERTY_TYPES: { value: TipoInmueble; label: string; icon: typeof Building2 }[] = [
  { value: 'Piso', label: 'Piso', icon: Building2 },
  { value: 'Casa', label: 'Casa', icon: Home },
  { value: 'Otro', label: 'Otro', icon: LayoutGrid },
];

/** Primer paso visual antes del formulario: elegir tipo de inmueble abre el
    resto de pasos (dirección, motivo, contacto...) en el pop-up — así no se
    le pide nada al visitante hasta que ha decidido interactuar. */
function PropertyTypeSelector({ onSelect }: { onSelect: (tipo: TipoInmueble) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className="group flex aspect-square flex-col items-center justify-center gap-2.5 rounded-2xl border-2 border-[#EAEAEA] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_24px_rgba(255,128,0,0.16)] active:scale-[0.96] active:translate-y-0"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/8 text-primary transition-transform duration-200 group-hover:scale-110 sm:h-14 sm:w-14">
            <Icon size={22} className="sm:hidden" />
            <Icon size={26} className="hidden sm:block" />
          </div>
          <span className="text-sm font-bold text-slate-900">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Banda de ancho completo, literalmente lo primero que ve cualquier visita
    al entrar al perfil — antes incluso del nombre de la inmobiliaria. Es el
    cambio central del rediseño: el selector Piso/Casa/Otro (el paso que de
    verdad arranca un lead) ya no vive metido en una tarjeta al lado de la
    bio, donde los mapas de calor mostraban poca atención, sino que es lo
    único que hay que mirar en esta pantalla.

    La foto de fondo (si la inmobiliaria cargó `hero_image_url`) ya no lleva
    texto encima — eso fue lo que obligaba a elegir entre lavarla con blanco
    o arriesgar la legibilidad. En vez de eso, todo el texto vive dentro de
    una tarjeta blanca flotando sobre la foto: la foto se ve limpia y el
    texto siempre tiene contraste perfecto, sea cual sea la imagen de fondo. */
function ValuationHero({
  agency,
  onSelect,
}: {
  agency: InmobiliariaPublica;
  onSelect: (tipo: TipoInmueble) => void;
}) {
  const bgUrl = useValidImageUrl(agency.hero_image_url);

  return (
    <section id="contactar" className="relative scroll-mt-14 overflow-hidden bg-surface">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {bgUrl ? (
          <img src={optimizedImageUrl(bgUrl, 1600)} alt="" className="h-full w-full object-cover" />
        ) : (
          <>
            <div className="absolute inset-0 bg-surface" />
            <div
              className="absolute -left-16 -top-16 h-[380px] w-[380px] rounded-full opacity-[0.12]"
              style={{ background: 'radial-gradient(circle, #FF8000, rgba(255,128,0,0.35), transparent 70%)', filter: 'blur(90px)' }}
            />
          </>
        )}
      </div>

      <div className="relative z-10 flex min-h-[480px] items-center justify-center px-6 py-16 sm:min-h-[580px] sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="w-full max-w-[540px] rounded-[32px] bg-white p-8 text-center shadow-[0_30px_70px_rgba(15,23,42,0.25)] sm:p-11"
        >
          <h2 className="text-[28px] font-bold tracking-[-0.01em] text-[#0F172A] sm:text-[36px]">
            Solicita tu valoración
          </h2>

          <div className="mt-8">
            <PropertyTypeSelector onSelect={onSelect} />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 1, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mt-6 flex items-center justify-center gap-1.5 text-xs font-medium text-primary/70 sm:text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5 3L19 10L12 12L12 19L9 15L5 3Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            Haz click y empezamos
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

/** Envuelve el formulario multi-paso ya existente (misma lógica de pasos y
    validación, ver AgencyLeadForm) en un diálogo superpuesto con fondo
    oscurecido — el único cambio real es el contenedor. */
/** Paso 1 compartido por CUALQUIER botón de la página que arranque un lead
    ("Solicitar valoración" en la bio, el CTA de cierre, el CTA fijo de
    móvil): elegir tipo de inmueble en una ventana, no saltar directo al
    formulario ni desplazar a la tarjeta del inicio. Solo la tarjeta del
    inicio (ValuationHero) tiene el selector inline, porque ya es ella misma
    la superficie de esa elección. */
function TypeSelectorModal({
  agency,
  onClose,
  onSelect,
}: {
  agency: InmobiliariaPublica;
  onClose: () => void;
  onSelect: (tipo: TipoInmueble) => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="type-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <motion.div
        key="type-modal-panel"
        role="dialog"
        aria-modal
        aria-label="Elige el tipo de inmueble que quieres valorar"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-[28px] bg-white p-7 text-center shadow-2xl shadow-black/20 sm:p-9"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>

          <h3 className="text-2xl font-bold text-[#0F172A]">Solicita tu valoración</h3>
          <p className="mt-1 text-sm text-ink-muted">¿Qué tipo de inmueble quieres valorar con {agency.nombre_comercial}?</p>

          <div className="mt-6">
            <PropertyTypeSelector onSelect={onSelect} />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function LeadFormModal({
  agency,
  tipoInmueble,
  onClose,
  onSuccess,
}: {
  agency: InmobiliariaPublica;
  tipoInmueble: TipoInmueble;
  onClose: () => void;
  onSuccess: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="lead-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <motion.div
        key="lead-modal-panel"
        role="dialog"
        aria-modal
        aria-label={`Solicita una valoración gratuita de tu ${tipoInmueble.toLowerCase()}`}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20 sm:p-7"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
          <p className="mb-1 pr-8 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Sin compromiso</p>
          <h3 className="mb-5 pr-8 text-lg font-extrabold text-slate-900">
            Solicita la valoración de tu {tipoInmueble.toLowerCase()}
          </h3>
          <AgencyLeadForm agency={agency} tipoInmueble={tipoInmueble} showStepCounter onSuccess={onSuccess} />
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

/**
 * Se llega por la URL nueva (`city` + `slug`, legible y con la ciudad para
 * SEO) o por la vieja (`id`, un uuid), que sigue viva porque ya se
 * compartieron enlaces con ese formato.
 */
export function InmobiliariaPerfilPage({ id, city, slug }: { id?: string; city?: string; slug?: string }) {
  const { agencies, loading } = useInmobiliarias();
  const agency = useMemo(
    () =>
      city && slug
        ? findAgencyByProfilePath(agencies, city, slug) ?? undefined
        : agencies.find((a) => a.id === id),
    [agencies, city, slug, id],
  );

  // Compartido entre el botón "Solicitar valoración" y el formulario
  // embebido más abajo: cualquiera de los dos que se envíe primero debe
  // revelar el teléfono también en el otro, no solo en el que se usó.
  const [showPhone, setShowPhone] = useState(false);

  // `agency.poblacion` puede llegar vacío de la vista del CRM (ver
  // agency-url.ts) — al entrar por la URL nueva, la ciudad ya viaja en el
  // propio path (/inmobiliarias-en-<ciudad>/...), así que se usa como
  // respaldo para no dejar huecos tipo "Estamos en , Gipuzkoa" en ninguna
  // campaña por ciudad. `NO_CITY_SLUG` ("espana") es el relleno que usa la
  // URL cuando ni siquiera hay ciudad — no es una ciudad real, así que no se
  // muestra como si lo fuera ("Estamos en España, Gipuzkoa" no tiene
  // sentido): se deja vacío y el resto de la página ya sabe caer solo a la
  // provincia.
  const displayCity = agency?.poblacion || (city && city !== NO_CITY_SLUG ? humanizeCitySlug(city) : '');

  // La presentación se recorta en el hero — no se muestra completa en
  // ningún otro sitio de la página, así que "Leer más" expande este mismo
  // párrafo en vez de enlazar a otro lado.
  const [bioExpanded, setBioExpanded] = useState(false);

  // Antes el botón "Leer más" solo salía si el texto pasaba de 168
  // caracteres — pero lo que de verdad lo recorta es el line-clamp-3 (3
  // líneas, no caracteres), que varía según el ancho de pantalla y el largo
  // de las palabras. Con textos cortos pero de palabras largas, o en
  // pantallas más angostas, el texto se recortaba igual sin que apareciera
  // el botón para expandirlo. Se mide si el párrafo realmente desborda sus
  // 3 líneas y solo entonces se muestra el botón.
  const bioRef = useRef<HTMLParagraphElement>(null);
  const [bioOverflowing, setBioOverflowing] = useState(false);
  useEffect(() => {
    if (bioExpanded) return;
    const el = bioRef.current;
    if (!el) return;
    const check = () => setBioOverflowing(el.scrollHeight > el.clientHeight + 1);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [agency?.texto_presentacion, bioExpanded]);

  // Tipo de inmueble elegido en el selector del hero — no-null abre el resto
  // del formulario (dirección, motivo, contacto...) en el pop-up.
  const [selectedTipo, setSelectedTipo] = useState<TipoInmueble | null>(null);

  // Cualquier CTA que no sea el selector inline del hero (el botón de la
  // bio, el CTA de cierre, el fijo de móvil) abre primero esta ventana de
  // "elige tipo" en vez de saltar directo al formulario o desplazar hasta
  // arriba — un único punto de entrada al flujo de lead, sea cual sea el
  // botón que lo dispara.
  const [showTypeModal, setShowTypeModal] = useState(false);

  // Ambientación 3D del hero: solo en desktop (en el móvil de una campaña de
  // pago no vale la pena el peso de three.js) y solo si el visitante no pidió
  // menos movimiento. Se revisa por si acaso cambia el tamaño de ventana o la
  // preferencia en caliente, no solo en el primer render.
  const [show3D, setShow3D] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = () => setShow3D(mq.matches && !prefersReducedMotion());
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // El globo del Bloque 3 (mapa/ubicación) va varias pantallas más abajo del
  // hero -- sin esto, three.js se descargaba en cuanto show3D era true, sin
  // importar si la visita llegaba a bajar hasta ahí.
  const mapSectionRef = useRef<HTMLElement>(null);
  const mapSectionInView = useEnteredViewport(mapSectionRef, 400);

  // Si el archivo de vídeo subido falla al cargar (ej. hosting caído), se
  // oculta toda la sección en vez de dejar un reproductor negro sin vídeo.
  const [videoBroken, setVideoBroken] = useState(false);

  const heroFotoUrl = useValidImageUrl(agency?.foto_url);

  // Si se llegó desde una búsqueda (lista de resultados), conserva el punto
  // buscado para poder mostrar distancia real en el mapa del perfil.
  const searchPoint = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    return lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
  }, []);

  /** Vuelve exactamente a la sección del directorio de la que se venía
   * (resultados con sus filtros, sección principal, carrusel de vídeos...),
   * no siempre al inicio del directorio. */
  const backUrl = useMemo(() => getLastDirectoryUrl(), []);

  // Canonical siempre en formato legible (ciudad + slug), incluso si se
  // llegó por el enlace viejo /inmobiliarias/<uuid> — así Google consolida
  // ambas URLs en una sola página indexada en vez de verlas como duplicadas.
  useSEO({
    enabled: !!agency,
    path: agency ? agencyProfilePath(agency, agencies) : '',
    title: agency
      ? `${agency.nombre_comercial} en ${agency.poblacion || agency.provincia || 'España'} — Inmobiliaria verificada | Cosiris`
      : '',
    description: agency
      ? (agency.texto_presentacion
          ? excerpt(agency.texto_presentacion, 155)
          : `${agency.nombre_comercial}, inmobiliaria verificada en ${agency.poblacion || agency.provincia}. Solicita una valoración gratuita de tu propiedad.`)
      : '',
  });

  // Al entrar por un enlace directo, `agencies` todavía es el mock (no
  // contiene este id) mientras Supabase responde — sin este chequeo se
  // mostraba "No encontramos esta inmobiliaria" un instante antes de que
  // el perfil real apareciera.
  if (!agency && loading) {
    // El logo de Cosiris, no el de la inmobiliaria: en este punto todavía no
    // sabemos cuál es — `agency` es justo lo que este loading está esperando
    // (y para la URL /inmobiliarias-en-<ciudad>/<slug>, que es la que usa
    // casi todo el tráfico real, ni siquiera se puede saber a qué
    // inmobiliaria corresponde el slug sin haber cargado antes el
    // directorio completo, porque el slug se calcula comparando contra
    // todas las de esa ciudad).
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-4">
        <motion.img
          src="/assets/logo_orange.png"
          alt="Cosiris"
          width={190}
          height={85}
          className="h-12 w-auto"
          animate={{ opacity: [0.45, 1, 0.45], scale: [0.94, 1, 0.94] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="text-sm font-medium text-slate-500">Cargando el perfil…</p>
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-bold text-slate-900">No encontramos esta inmobiliaria</p>
          <button
            type="button"
            onClick={() => navigateTo(getLastDirectoryUrl())}
            className="mt-4 text-sm font-semibold text-[#FF8000] hover:underline"
          >
            ← Volver al directorio
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  // Un cliente puede haber pegado por error un link que no es de YouTube,
  // Vimeo, ni un archivo de vídeo (por ejemplo, la URL de su propia página
  // web) — mejor no mostrar la sección de vídeo que mostrar un reproductor
  // roto sin sonido ni imagen.
  const hasPlayableVideo = !!agency.media_presentacion_url
    && (!!getVideoEmbed(agency.media_presentacion_url) || isDirectVideoUrl(agency.media_presentacion_url))
    && !videoBroken;

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <div className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-sm">
        <div className="flex h-14 w-full items-center justify-between px-1 sm:px-2">
          <button
            type="button"
            onClick={() => navigateTo(backUrl)}
            className="group flex items-center gap-1 rounded-full px-1.5 py-1.5 text-sm font-semibold text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
            aria-label="Volver a resultados"
          >
            <ArrowLeft size={15} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Volver al directorio</span>
          </button>
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); navigateTo('/'); }}
            className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-90"
          >
            <img src="/assets/logo_orange.png" alt="Cosiris" width="380" height="170" className="h-10 w-auto" />
          </a>
        </div>
      </div>

      <ValuationHero agency={agency} onSelect={setSelectedTipo} />

      {showTypeModal && (
        <TypeSelectorModal
          agency={agency}
          onClose={() => setShowTypeModal(false)}
          onSelect={(tipo) => {
            setShowTypeModal(false);
            setSelectedTipo(tipo);
          }}
        />
      )}

      {selectedTipo && (
        <LeadFormModal
          agency={agency}
          tipoInmueble={selectedTipo}
          onClose={() => setSelectedTipo(null)}
          onSuccess={() => setShowPhone(true)}
        />
      )}

      <main className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-20 pt-12">

        <div className="relative">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full opacity-[0.08]"
              style={{
                background: 'radial-gradient(circle, #FF8000, rgba(255,128,0,0.35), transparent 70%)',
                filter: 'blur(100px)',
                animation: 'float-blob 22s ease-in-out infinite',
              }}
            />
          </div>

          <div className={`relative z-10 mt-10 grid grid-cols-1 items-start gap-10 ${hasPlayableVideo ? 'md:grid-cols-[1fr_1.3fr] md:gap-10 lg:gap-16' : ''}`}>
            {/* El vídeo va primero en el DOM (columna izquierda desde
                tablet) — en móvil, al ser grid-cols-1, igual queda arriba
                del bloque de perfil. El corte es en `md` (768px), no `lg`
                (1024px): de lo contrario, entre esos dos anchos, un vídeo
                vertical angosto quedaba centrado en una columna de ancho
                completo con muchísimo blanco a los lados. Sin vídeo, la bio
                se limita a un ancho de lectura cómodo y se centra en la fila
                completa — dejarla en columna angosta pegada a la izquierda
                de un contenedor de 1400px, con toda esa franja vacía a la
                derecha sin usar, se veía desangelado. */}
            {hasPlayableVideo && agency.media_presentacion_url && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
              >
                <VideoCard
                  url={agency.media_presentacion_url}
                  nombre={agency.nombre_comercial}
                  logoUrl={agency.logo_url}
                  logoPos={agency.logo_pos}
                  posterUrl={heroFotoUrl}
                  onError={() => setVideoBroken(true)}
                />
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className={`relative ${heroFotoUrl ? 'md:pr-[170px] lg:pr-[220px] xl:pr-[260px]' : ''} ${!hasPlayableVideo ? 'md:mx-auto md:max-w-[760px]' : ''}`}
            >
              {/* Foto del agente junto al nombre — en móvil centrada encima
                  del bloque, desde tablet (`md`) flotando a la derecha del
                  texto (mismo corte que la columna del vídeo, arriba). */}
              {heroFotoUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
                  className="pointer-events-none relative z-10 mb-6 flex justify-center md:absolute md:right-0 md:top-0 md:mb-0 md:justify-end"
                >
                  <FadeImage
                    src={optimizedImageUrl(heroFotoUrl, 400)}
                    alt={agency.nombre_agente}
                    style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
                    className="h-28 w-28 rounded-full border-4 border-white object-cover shadow-xl shadow-slate-900/15 sm:h-36 sm:w-36 md:h-[140px] md:w-[140px] lg:h-[180px] lg:w-[180px]"
                    decoding="async"
                  />
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  {displayCity || agency.provincia}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-3 py-1.5 text-[11px] font-semibold text-primary shadow-soft">
                  <BadgeCheck size={12} /> Verificada
                </span>
              </div>

              <h1 className="mt-6 text-[40px] font-black leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl lg:text-[56px]">
                {agency.nombre_comercial}
              </h1>

              <div className="mt-4 flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={16} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span className="text-sm font-bold text-foreground">{agency.rating?.toFixed(1)}</span>
                {agency.num_opiniones != null && (
                  <span className="text-sm text-ink-muted">({agency.num_opiniones} opiniones)</span>
                )}
              </div>

              <p className="mt-4 flex items-center gap-1.5 text-body-sm text-ink-muted">
                <MapPin size={15} className="shrink-0 text-primary" /> {[displayCity, agency.provincia].filter(Boolean).join(', ')}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-body-sm text-ink-muted">
                <BadgeCheck size={15} className="shrink-0 text-primary" /> Inmobiliaria verificada por Cosiris
              </p>

              <p ref={bioRef} className={`mt-6 max-w-[520px] text-body leading-relaxed text-ink-muted ${bioExpanded ? '' : 'line-clamp-3'}`}>
                {agency.texto_presentacion}
              </p>
              {(bioOverflowing || bioExpanded) && (
                <button
                  type="button"
                  onClick={() => setBioExpanded((v) => !v)}
                  className="mt-1.5 text-sm font-bold text-primary hover:underline"
                >
                  {bioExpanded ? 'Leer menos' : 'Leer más'}
                </button>
              )}

              <div className="mt-5 flex items-center gap-2.5">
                <User size={15} className="shrink-0 text-ink-muted" />
                <div className="leading-tight">
                  <p className="text-sm font-semibold text-foreground">{agency.nombre_agente}</p>
                  <p className="text-xs text-ink-muted">Agente inmobiliario</p>
                </div>
              </div>

              <div className="mt-8">
                <CtaButton agency={agency} showPhone={showPhone} onOpenTypeSelector={() => setShowTypeModal(true)} />
              </div>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.14 }}
          className="mt-12"
        >
          <ProofStrip agency={agency} />
        </motion.div>

      </main>

      {/* Cada bloque de aquí en adelante es una banda de ANCHO COMPLETO de la
          página (fondo a todo lo ancho de la pantalla), no una tarjeta
          redondeada flotando dentro del contenedor — el contenido interno sí
          se alinea al mismo max-width que el resto de la página. */}

      {/* Bloque 2 — franja compacta "por qué elegirnos". El cliente la apaga
          desde el CRM con `mostrar_diferenciales` (por defecto encendida) —
          ver live-inmobiliarias.ts. Antes era una sección grande con titular
          comparativo + 4 tarjetas; se comprimió a una sola franja de iconos
          para no competir en altura ni atención con las secciones que sí
          convierten (valoración arriba, reseñas, mapa). */}
      {agency.mostrar_diferenciales !== false && (
        <section className="bg-surface">
          <div className="relative mx-auto max-w-[1400px] px-6 py-10 sm:py-12">
            <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Confianza</span>
            <h3 className="mt-1 text-2xl font-bold text-[#0F172A] sm:text-[26px]">Por qué elegirnos</h3>
            <div className="mt-5">
              <DifferentiatorsStrip />
            </div>
          </div>
        </section>
      )}

      {/* Bloque 3 — mapa a la izquierda, reseñas a la derecha */}
      <section ref={mapSectionRef} className="bg-white">
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
          {/* El globo va en la esquina del bloque, no encima del texto — un
              detalle que casi no se nota a primer vistazo, no algo que
              compita con el título de la sección. También en desktop, three.js
              solo se descarga cuando este bloque está a punto de entrar en
              pantalla (margin negativo generoso) -- si no, cualquiera que no
              llegue a bajar hasta aquí paga igual los ~900KB de la librería. */}
          {show3D && mapSectionInView && (
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.6 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.2, ease: [0.19, 1, 0.22, 1] }}
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-4 hidden h-[130px] w-[130px] lg:block"
            >
              <Suspense fallback={null}>
                <LocationGlobe colorHex={agency.color_hex} />
              </Suspense>
            </motion.div>
          )}

          {/* LocationSection y ReviewsList son quienes de verdad llaman a
              useJsApiLoader (Maps JS SDK, 152KB) -- sin este guard se
              descargaba en cuanto cargaba la página, sin importar si la
              visita llegaba a bajar hasta este bloque. mapSectionInView ya
              existe (ver el globo 3D más arriba) y dispara con 400px de
              antelación, así que no hay pop-in visible al hacer scroll. */}
          {mapSectionInView && (
            <div className={`grid grid-cols-1 gap-10 ${agency.lat != null && agency.lng != null ? 'lg:grid-cols-[3fr_2fr] lg:gap-[72px]' : ''}`}>
              {agency.lat != null && agency.lng != null && (
                <div>
                  <LocationSection agency={agency} searchPoint={searchPoint} displayCity={displayCity} />
                </div>
              )}
              <div className="flex">
                <ReviewsList agency={agency} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Bloque 3 — objeciones FAQ */}
      <section className="bg-surface">
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
          <div className="mb-14">
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">PREGUNTAS / PROPIETARIOS</span>
            <h2 className="mt-4 text-[44px] font-bold leading-[110%] tracking-[-0.02em] text-foreground sm:text-[48px]">
              ¿Tienes dudas antes de vender?
            </h2>
            <div className="mt-5 h-1 w-16 rounded-full bg-primary" />
            <p className="mt-6 max-w-[520px] text-body leading-relaxed text-ink-muted">
              Resolvemos las preguntas que más suelen hacerse los propietarios antes de poner su vivienda en venta.
            </p>
          </div>
          <Accordion items={FAQ} />
        </div>
      </section>

      {/* Bloque 4 — CTA de cierre. Justo el hueco que quedaba después de las
          FAQ: quien baja leyendo todo el perfil sin rellenar el formulario
          de arriba, no tenía ninguna otra oportunidad de convertir. Es el
          último bloque de la página — sin footer genérico del sitio detrás,
          que solo distraía con navegación que no pinta nada aquí. */}
      <section className="bg-primary">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center sm:py-20">
          <h2 className="text-[32px] font-bold leading-[110%] tracking-[-0.02em] text-white sm:text-[40px]">
            ¿Listo para saber cuánto vale tu vivienda?
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-lg leading-[170%] text-white/80">
            Pide tu valoración gratuita y sin compromiso — te respondemos el mismo día.
          </p>
          <button
            type="button"
            onClick={() => setShowTypeModal(true)}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.1em] text-primary shadow-lg shadow-black/10 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Quiero saber cuánto vale mi vivienda
          </button>
        </div>
      </section>

      {/* CTA fija en móvil — mismo paso 1 (elegir tipo) que cualquier otro
          botón de la página, no un atajo de scroll hacia arriba. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:hidden">
        <button
          type="button"
          onClick={() => setShowTypeModal(true)}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white shadow-md shadow-primary/25 transition-transform active:scale-[0.98]"
        >
          Contactar con {agency.nombre_comercial}
        </button>
      </div>
      <div aria-hidden="true" className="h-[76px] lg:hidden" />
    </div>
  );
}
