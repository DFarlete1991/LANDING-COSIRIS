import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';
import {
  ArrowLeft, BadgeCheck, Building2, Check, ChevronLeft, ChevronRight, Copy, Home, LayoutGrid, MapPin, MapPinned,
  MessageCircle, Phone, ShieldCheck, Star, User, Users, Volume2, VolumeX, Wallet, Briefcase, Zap, X,
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
const ProfileHeroOrbs = lazy(() => import('../ui/ProfileHeroOrbs'));
const LocationGlobe = lazy(() => import('../ui/LocationGlobe'));

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

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
  { icon: MessageCircle, title: 'Trato directo, sin intermediarios', text: 'Hablas con quien lleva tu caso, no con un call center genérico.' },
  { icon: MapPinned, title: 'Conocemos tu zona al detalle', text: 'Sabemos qué se vende, a qué precio y en cuánto tiempo, calle por calle.' },
  { icon: Zap, title: 'Respuesta rápida', text: 'Contestamos en el mismo día, no en una semana.' },
  { icon: ShieldCheck, title: 'Verificados por Cosiris', text: 'No cualquiera aparece en el directorio — validamos cada inmobiliaria.' },
];

function WhyUsGrid({ fourAcross }: { fourAcross?: boolean }) {
  return (
    // text-left explicito: en el layout de video horizontal, el bloque que
    // envuelve esto usa text-center para el título/descripción, y sin esto
    // esa alineación se colaría también dentro de cada tarjeta.
    <div className={`grid grid-cols-1 gap-5 text-left sm:grid-cols-2 ${fourAcross ? 'lg:grid-cols-4' : ''}`}>
      {WHY_US.map(({ icon: Icon, title, text }, i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.4, delay: 0.1 * i, ease: [0.19, 1, 0.22, 1] }}
          className="group flex min-h-[150px] flex-col rounded-[22px] border border-[#ECE8E1] bg-white p-6 shadow-[0_10px_30px_rgba(30,35,50,.05)] transition-all duration-[250ms] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(30,35,50,.1)]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/8 text-primary">
            <Icon size={20} />
          </div>
          <div className="mt-3">
            <p className="text-[22px] font-semibold leading-tight text-[#0F172A]">{title}</p>
            <p className="mt-1 text-base leading-[170%] text-[#68707F]">{text}</p>
          </div>
        </motion.div>
      ))}
    </div>
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
  colorHex,
  posterUrl,
  onError,
  onOrientationChange,
}: {
  url: string;
  nombre: string;
  logoUrl?: string | null;
  logoPos?: string | null;
  colorHex?: string;
  posterUrl?: string | null;
  onError?: () => void;
  // Le avisa al bloque que envuelve el video (no a este componente: la caja
  // del video ya se ajusta sola por CSS, ver el comentario en el <video> de
  // abajo) para decidir el layout de la seccion -- un video horizontal deja
  // demasiado espacio vacio en la columna angosta pensada para uno vertical.
  onOrientationChange?: (o: VideoOrientation) => void;
}) {
  const resolvedLogoUrl = useValidImageUrl(logoUrl);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [muted, setMuted] = useState(true);
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

  useEffect(() => {
    onOrientationChange?.(orientation);
  }, [orientation, onOrientationChange]);

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
        if (entry.isIntersecting) videoRef.current?.play().catch(() => {});
        else videoRef.current?.pause();
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
      <div className="flex items-center gap-4 mb-4">
        <span className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Video de presentación</span>
        <div className="h-px flex-1 bg-[#E5DDD3]" />
      </div>

      <div className="rounded-[24px] bg-white p-2 shadow-[0_10px_40px_rgba(30,35,50,.08)]">
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
              // La caja de ESTE video se ajusta sola por CSS (ancho automático,
              // alto tope) -- no depende de esto. onLoadedMetadata aquí solo
              // reporta la orientación hacia arriba, para que el bloque
              // exterior decida su layout (ver onOrientationChange).
              preload="metadata"
              poster={posterUrl ? optimizedImageUrl(posterUrl, 640) : undefined}
              className="block max-h-[70vh] w-auto max-w-full object-contain sm:max-h-[560px] sm:max-w-[640px]"
              src={url}
              onError={onError}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  setOrientation(v.videoHeight > v.videoWidth ? 'vertical' : 'horizontal');
                }
              }}
            />

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
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary bg-primary/8"
            style={colorHex ? { backgroundColor: `${colorHex}14`, color: colorHex } : undefined}
          >
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
  onRevealed,
}: {
  agency: InmobiliariaPublica;
  showPhone: boolean;
  onRevealed: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

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

  return (
    <>
      {showPhone ? (
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
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-200 hover:bg-primary-hover hover:shadow-card active:scale-[0.98]"
        >
          <Phone size={14} /> Solicitar valoración
        </button>
      )}

      {createPortal(
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
                aria-hidden="true"
              />
              <motion.div
                key="panel"
                role="dialog"
                aria-modal
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                onClick={() => setShowModal(false)}
                className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20"
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    aria-label="Cerrar"
                    className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Sin compromiso</p>
                  <h3 className="mb-5 text-lg font-extrabold text-slate-900">Cuéntale a {agency.nombre_comercial} qué necesitas</h3>
                  <AgencyLeadForm agency={agency} onSuccess={() => { onRevealed(); setShowModal(false); }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
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
function PropertyTypeSelector({ colorHex, onSelect }: { colorHex?: string; onSelect: (tipo: TipoInmueble) => void }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onSelect(value)}
          className="group flex flex-col items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-5 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_10px_28px_rgba(255,128,0,0.15)] active:scale-[0.97]"
        >
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/8 text-primary transition-colors duration-200 group-hover:bg-primary group-hover:text-white"
            style={colorHex ? { color: colorHex, backgroundColor: `${colorHex}14` } : undefined}
          >
            <Icon size={20} />
          </div>
          <span className="text-sm font-bold text-slate-900">{label}</span>
        </button>
      ))}
    </div>
  );
}

/** Envuelve el formulario multi-paso ya existente (misma lógica de pasos y
    validación, ver AgencyLeadForm) en un diálogo superpuesto con fondo
    oscurecido — el único cambio real es el contenedor. */
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

  // Si el archivo de vídeo subido falla al cargar (ej. hosting caído), se
  // oculta toda la sección en vez de dejar un reproductor negro sin vídeo.
  const [videoBroken, setVideoBroken] = useState(false);
  // Un video horizontal deja mucho espacio vacío en la columna angosta
  // pensada para uno vertical -- con esto el bloque de "por qué elegirnos"
  // cambia a un layout centrado (video arriba, tarjetas en fila) solo para
  // ese caso. Empieza en null/vertical (el layout de 2 columnas de siempre)
  // hasta que el <video> reporte su tamaño real.
  const [videoOrientation, setVideoOrientation] = useState<VideoOrientation>(null);

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
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#FF8000]" />
        <p className="text-sm font-medium text-slate-500">Cargando inmobiliaria…</p>
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
            <img src="/assets/logo_orange.png" alt="Cosiris" className="h-10 w-auto" />
          </a>
        </div>
      </div>

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
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full opacity-[0.07]"
              style={{
                maskImage: 'radial-gradient(circle at 78% 45%, transparent 0%, transparent 14%, black 42%)',
                WebkitMaskImage: 'radial-gradient(circle at 78% 45%, transparent 0%, transparent 14%, black 42%)',
              }}
            >
            <defs>
              <pattern id="honeycomb" width="80" height="46.19" patternUnits="userSpaceOnUse" patternTransform="scale(1.5)">
                <path d="M13.33 0L40 0L53.33 23.09L40 46.19L13.33 46.19L0 23.09Z" fill="none" className="stroke-primary" strokeWidth="0.9"/>
                <path d="M53.33 0L80 0L93.33 23.09L80 46.19L53.33 46.19L40 23.09Z" fill="none" className="stroke-primary" strokeWidth="0.9"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#honeycomb)"/>
          </svg>

          {show3D && (
            <div className="absolute -right-10 top-1/2 hidden h-[380px] w-[400px] -translate-y-1/2 opacity-80 lg:block">
              <Suspense fallback={null}>
                <ProfileHeroOrbs colorHex={agency.color_hex} />
              </Suspense>
            </div>
          )}
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative lg:pr-[280px] xl:pr-[320px]"
            >
              {/* Foto del agente — en móvil se muestra centrada encima del contenido;
                  en lg+ flota en el hueco a la derecha del texto, desplazada hacia
                  la izquierda para que se sienta parte del bloque informativo y no
                  compita con el formulario. Se mantiene limpia, sin etiquetas ni
                  badges superpuestos — el nombre va en la ficha de abajo. */}
              {heroFotoUrl && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.2 }}
                  className="pointer-events-none relative z-10 mb-8 flex justify-center lg:absolute lg:right-14 lg:top-1/2 lg:mb-0 lg:-translate-y-1/2 lg:justify-start xl:right-12"
                >
                  <div className="relative">
                    <span className="absolute -left-7 -top-6 h-14 w-14 rounded-full bg-primary/10" aria-hidden="true" />
                    <span className="absolute -bottom-5 -right-4 h-9 w-9 rounded-full bg-primary/15" aria-hidden="true" />
                    <span className="absolute -right-8 top-8 h-5 w-5 rounded-full bg-primary/20" aria-hidden="true" />
                    <FadeImage
                      src={optimizedImageUrl(heroFotoUrl, 480)}
                      alt={agency.nombre_agente}
                      style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
                      className="relative h-40 w-40 rounded-full border-4 border-white object-cover shadow-2xl shadow-slate-900/15 sm:h-52 sm:w-52 xl:h-60 xl:w-60"
                      decoding="async"
                    />
                  </div>
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
                <CtaButton agency={agency} showPhone={showPhone} onRevealed={() => setShowPhone(true)} />
              </div>
            </motion.div>

            <motion.div
              id="contactar"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE, delay: 0.08 }}
              className="scroll-mt-24 rounded-card border border-border bg-card p-6 shadow-[0_24px_64px_rgba(0,0,0,0.12)] sm:p-8"
            >
              <h2 className="text-xl font-bold text-foreground">¿Qué tipo de inmueble quieres valorar?</h2>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                Elige una opción para empezar tu valoración gratuita — sin compromiso.
              </p>
              <div className="mt-6">
                <PropertyTypeSelector colorHex={agency.color_hex} onSelect={setSelectedTipo} />
              </div>
            </motion.div>
          </div>
        </div>

        {selectedTipo && (
          <LeadFormModal
            agency={agency}
            tipoInmueble={selectedTipo}
            onClose={() => setSelectedTipo(null)}
            onSuccess={() => setShowPhone(true)}
          />
        )}

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

      {/* Bloque 2 — por qué elegirnos + video. Un video horizontal deja
          demasiado espacio vacío en la columna angosta de 2 columnas (pensada
          para uno vertical), así que ese caso pasa a un layout centrado:
          video arriba, texto debajo, tarjetas en una sola fila. El video y el
          bloque de texto son siempre los mismos dos hijos en el mismo orden
          (solo cambian clases) para que VideoCard no se desmonte al detectar
          la orientación y reinicie el vídeo. */}
      {(() => {
        const isHorizontalVideo = hasPlayableVideo && videoOrientation === 'horizontal';
        return (
          <section className="bg-surface">
            <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
              <div
                className={
                  isHorizontalVideo
                    ? 'flex flex-col items-center gap-10'
                    : `grid grid-cols-1 gap-10 ${hasPlayableVideo ? 'lg:grid-cols-[2fr_3fr] lg:gap-16' : ''}`
                }
              >
                {hasPlayableVideo && agency.media_presentacion_url && (
                  <div className={isHorizontalVideo ? 'w-full max-w-2xl' : 'lg:pt-16'}>
                    <VideoCard
                      url={agency.media_presentacion_url}
                      nombre={agency.nombre_comercial}
                      logoUrl={agency.logo_url}
                      logoPos={agency.logo_pos}
                      colorHex={agency.color_hex}
                      posterUrl={heroFotoUrl}
                      onError={() => setVideoBroken(true)}
                      onOrientationChange={setVideoOrientation}
                    />
                  </div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
                  className={isHorizontalVideo ? 'w-full max-w-3xl text-center' : undefined}
                >
                  <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Sobre nosotros</span>

                  <h2 className="mt-5 text-[44px] font-bold leading-[110%] tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">
                    ¿Por qué vender con<br />{agency.nombre_comercial} y no<br />con otra inmobiliaria?
                  </h2>

                  <div className={`mt-6 h-1 w-16 rounded-full bg-primary ${isHorizontalVideo ? 'mx-auto' : ''}`} />

                  <p className={`mt-6 max-w-[520px] text-lg leading-[170%] text-[#68707F] ${isHorizontalVideo ? 'mx-auto' : ''}`}>
                    Combinamos experiencia local, transparencia y tecnología para ayudarte a vender mejor tu propiedad.
                  </p>

                  <div className="mt-10">
                    <WhyUsGrid fourAcross={isHorizontalVideo} />
                  </div>
                </motion.div>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Bloque 3 — mapa a la izquierda, reseñas a la derecha */}
      <section className="bg-white">
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
          {/* El globo va en la esquina del bloque, no encima del texto — un
              detalle que casi no se nota a primer vistazo, no algo que
              compita con el título de la sección. */}
          {show3D && (
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

      {/* Bloque 4 — CTA de cierre. Justo el hueco que quedaba entre las FAQ y
          el footer: quien baja leyendo toda la página sin rellenar el
          formulario de arriba, no tenía ninguna otra oportunidad de
          convertir. */}
      <section className="bg-primary">
        <div className="mx-auto max-w-[1400px] px-6 py-16 text-center sm:py-20">
          <h2 className="text-[32px] font-bold leading-[110%] tracking-[-0.02em] text-white sm:text-[40px]">
            ¿Listo para saber cuánto vale tu vivienda?
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] text-lg leading-[170%] text-white/80">
            Pide tu valoración gratuita y sin compromiso — te respondemos el mismo día.
          </p>
          <a
            href="#contactar"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById('contactar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-sm font-bold uppercase tracking-[0.1em] text-primary shadow-lg shadow-black/10 transition-all duration-200 hover:opacity-90 active:scale-[0.98]"
          >
            Quiero saber cuánto vale mi vivienda
          </a>
        </div>
      </section>

      <Footer />

      {/* CTA fija en móvil — el formulario grande vive arriba del todo en el hero,
          así que en móvil, tras hacer scroll por el resto del perfil, esto ofrece
          un atajo rápido de vuelta a él sin tener que scrollear hacia arriba a mano. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm lg:hidden">
        <a
          href="#contactar"
          onClick={(e) => {
            e.preventDefault();
            document.getElementById('contactar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-white shadow-md shadow-primary/25 transition-transform active:scale-[0.98]"
        >
          Contactar con {agency.nombre_comercial}
        </a>
      </div>
      <div aria-hidden="true" className="h-[76px] lg:hidden" />
    </div>
  );
}
