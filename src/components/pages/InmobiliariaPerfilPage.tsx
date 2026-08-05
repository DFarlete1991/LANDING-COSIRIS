import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';
import {
  ArrowLeft, BadgeCheck, Check, ChevronLeft, ChevronRight, Copy, Home, MapPin, MapPinned,
  MessageCircle, Phone, ShieldCheck, Star, User, Users, Wallet, Briefcase, Zap, X,
} from 'lucide-react';
import { Footer } from '../Footer';
import { AgencyLeadForm } from '../ui/AgencyLeadForm';
import { AgencyMap } from '../ui/AgencyMap';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { REVIEWS_PLACEHOLDER } from '@/data/reviews-placeholder';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { navigateTo, getLastDirectoryUrl } from '@/lib/utils';
import { haversineKm, formatDistanceKm } from '@/lib/geo';
import { fetchPlaceReviews, type GoogleReview } from '@/lib/google-places';
import { fetchResenasManuales, type ResenaManual } from '@/data/live-resenas';
import { getVideoEmbed, isDirectVideoUrl } from '@/lib/video-embed';

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

function WhyUsGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
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
}: {
  url: string;
  nombre: string;
  logoUrl?: string | null;
  logoPos?: string | null;
  colorHex?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
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
          <div className={`relative mx-auto overflow-hidden rounded-[16px] bg-black ${isVertical ? 'aspect-[9/16] w-full max-w-[300px]' : 'aspect-video w-full max-w-[640px]'}`}>
            <video
              ref={videoRef}
              controls={playing}
              className="h-full w-full object-contain"
              src={url}
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                if (v.videoWidth && v.videoHeight) {
                  setOrientation(v.videoHeight > v.videoWidth ? 'vertical' : 'horizontal');
                }
              }}
            />

            {!playing && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-transparent to-black/55">
                <p className="mb-4 max-w-[200px] text-center text-sm font-semibold leading-snug text-white drop-shadow-md">
                  Conoce nuestra inmobiliaria<br />y cómo trabajamos por ti.
                </p>
                <button
                  type="button"
                  onClick={() => { videoRef.current?.play(); }}
                  className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white shadow-lg shadow-black/20 transition-transform duration-200 hover:scale-105 active:scale-95"
                  aria-label="Reproducir vídeo"
                >
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-7 w-7 fill-primary">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {logoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.1, ease: [0.19, 1, 0.22, 1] }}
          className="relative z-10 -mb-8 mt-5 flex justify-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-white shadow-lg shadow-slate-900/10">
            <img
              src={logoUrl}
              alt={nombre}
              style={{ objectPosition: logoPos ?? '50% 50%' }}
              className="h-full w-full rounded-full object-cover"
            />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, delay: 0.15, ease: [0.19, 1, 0.22, 1] }}
        className={`flex items-center gap-3 rounded-[22px] border border-[#ECE8E1] bg-white px-5 py-4 shadow-[0_10px_30px_rgba(30,35,50,.05)] ${logoUrl ? 'pt-9' : 'mt-5'}`}
      >
        {!logoUrl && (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-primary bg-primary/8"
            style={colorHex ? { backgroundColor: `${colorHex}14`, color: colorHex } : undefined}
          >
            <ShieldCheck size={18} />
          </div>
        )}
        <div className={logoUrl ? 'w-full text-center' : ''}>
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

/** Carrusel tipo ruleta vertical para cuando hay más de 3 reseñas: cada
    reseña entra desde abajo, hace un pequeño zoom mientras se muestra y
    después sube para dejar paso a la siguiente. Se queda estático al pasar
    el cursor (o al tocarlo en móvil). */
function ReviewsCarousel({ reviews }: { reviews: DisplayReview[] }) {
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

  const active = reviews[index];

  // Avanza la ruleta solo si está visible, no está en pausa y el usuario no ha
  // interactuado con ella. En táctil, en cuanto se toca, queda estática.
  useEffect(() => {
    if (reducedMotion || paused || !inView || (isTouch && wasTouched)) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % reviews.length), 4600);
    return () => clearTimeout(t);
  }, [reducedMotion, paused, inView, isTouch, wasTouched, index, reviews.length]);

  const goPrev = () => {
    setPaused(true);
    setIndex((i) => (i - 1 + reviews.length) % reviews.length);
  };

  const goNext = () => {
    setPaused(true);
    setIndex((i) => (i + 1) % reviews.length);
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
            key={active.key}
            initial={{ y: 84, opacity: 0, scale: 0.94 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -84, opacity: 0, scale: 0.94 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="group overflow-hidden rounded-[24px] border border-[#ECE8E1] bg-white p-6 shadow-[0_8px_28px_rgba(24,35,52,.04)]"
          >
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: paused || reducedMotion ? 1 : 1.04 }}
              transition={{ duration: 3.9, ease: 'easeOut', delay: 0.6 }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                    <User size={16} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-lg font-semibold text-[#0F172A]">{active.autor}</p>
                  </div>
                </div>
                <span className="inline-flex shrink-0 items-center rounded-full bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary">
                  {active.fecha}
                </span>
              </div>

              <p className="mt-3 text-sm leading-[160%] text-[#68707F]">&ldquo;{active.comentario}&rdquo;</p>

              <div className="mt-3 flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={15}
                    className={s < active.rating ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#E2DCD3]'}
                  />
                ))}
              </div>
            </motion.div>
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/8 text-primary">
                  <User size={16} />
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

function LocationSection({ agency, searchPoint }: { agency: InmobiliariaPublica; searchPoint: { lat: number; lng: number } | null }) {
  if (agency.lat == null || agency.lng == null) return null;

  const location = { lat: agency.lat, lng: agency.lng };
  const distanceKm = searchPoint ? haversineKm(searchPoint, location) : null;

  return (
    <div>
      <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">📍 Ubicación</span>

      <h3 className="mt-4 text-[48px] font-bold leading-[110%] tracking-[-0.02em] text-[#0F172A]">
        Estamos en {agency.poblacion}, {agency.provincia}
      </h3>

      <p className="mt-4 text-lg leading-[170%] text-[#68707F]">
        Conocemos cada rincón de la zona para ayudarte a vender mejor tu propiedad.
      </p>

      <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary/8 px-4 py-2 text-sm font-semibold text-[#0F172A]">
        <span className="text-base">📍</span>
        Especialistas en {agency.poblacion} y municipios cercanos
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
                <p className="text-sm font-bold text-[#0F172A]">{agency.poblacion}</p>
                <p className="text-xs text-[#68707F]">Zona centro</p>
              </div>
            </div>

            {distanceKm != null && (
              <>
                <div className="h-8 w-px bg-[#ECE8E1]" />

                <div className="flex items-center gap-4">
                  <span className="text-xl">🚗</span>
                  <div>
                    <p className="text-sm font-bold text-[#0F172A]">{formatDistanceKm(distanceKm)}</p>
                    <p className="text-xs text-[#68707F]">de tu búsqueda</p>
                  </div>
                </div>
              </>
            )}
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
          <motion.button
            key={item.q}
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
        ))}
      </div>

      <div className="relative flex min-h-[280px] items-center lg:pl-4">
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

export function InmobiliariaPerfilPage({ id }: { id: string }) {
  const { agencies } = useInmobiliarias();
  const agency = agencies.find((a) => a.id === id);

  // Compartido entre el botón "Solicitar valoración" y el formulario
  // embebido más abajo: cualquiera de los dos que se envíe primero debe
  // revelar el teléfono también en el otro, no solo en el que se usó.
  const [showPhone, setShowPhone] = useState(false);

  // La presentación se recorta en el hero — no se muestra completa en
  // ningún otro sitio de la página, así que "Leer más" expande este mismo
  // párrafo en vez de enlazar a otro lado.
  const [bioExpanded, setBioExpanded] = useState(false);

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
    && (!!getVideoEmbed(agency.media_presentacion_url) || isDirectVideoUrl(agency.media_presentacion_url));

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
          </div>

          <div className="relative z-10 mt-10 grid grid-cols-1 items-start gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="relative"
            >
              {/* Foto del agente — en móvil se muestra centrada encima del contenido;
                  en lg+ flota en el hueco a la derecha del texto, desplazada hacia
                  la izquierda para que se sienta parte del bloque informativo y no
                  compita con el formulario. Se mantiene limpia, sin etiquetas ni
                  badges superpuestos — el nombre va en la ficha de abajo. */}
              {agency.foto_url && (
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
                    <img
                      src={agency.foto_url}
                      alt={agency.nombre_agente}
                      style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
                      className="relative h-40 w-40 rounded-full border-4 border-white object-cover shadow-2xl shadow-slate-900/15 sm:h-52 sm:w-52 xl:h-60 xl:w-60"
                    />
                  </div>
                </motion.div>
              )}

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-primary">
                  {agency.poblacion}
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
                <MapPin size={15} className="shrink-0 text-primary" /> {agency.poblacion}, {agency.provincia}
              </p>

              <p className="mt-2 flex items-center gap-1.5 text-body-sm text-ink-muted">
                <BadgeCheck size={15} className="shrink-0 text-primary" /> Inmobiliaria verificada por Cosiris
              </p>

              <p className={`mt-6 max-w-[520px] text-body leading-relaxed text-ink-muted ${bioExpanded ? '' : 'line-clamp-3'}`}>
                {bioExpanded ? agency.texto_presentacion : excerpt(agency.texto_presentacion)}
              </p>
              {agency.texto_presentacion.length > 168 && (
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
              <h2 className="text-xl font-bold text-foreground">Solicita una valoración gratuita</h2>
              <p className="mt-2 text-body-sm leading-relaxed text-ink-muted">
                Cuéntanos qué necesitas y uno de nuestros asesores se pondrá en contacto contigo sin compromiso.
              </p>
              <div className="mt-6">
                <AgencyLeadForm agency={agency} onSuccess={() => setShowPhone(true)} />
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

      {/* Bloque 2 — por qué elegirnos + video */}
      <section className="bg-surface">
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
          <div className={`grid grid-cols-1 gap-10 ${hasPlayableVideo ? 'lg:grid-cols-[2fr_3fr] lg:gap-16' : ''}`}>
            {hasPlayableVideo && agency.media_presentacion_url && (
              <div className="lg:pt-16">
                <VideoCard
                  url={agency.media_presentacion_url}
                  nombre={agency.nombre_comercial}
                  logoUrl={agency.logo_url}
                  logoPos={agency.logo_pos}
                  colorHex={agency.color_hex}
                />
              </div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
            >
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Sobre nosotros</span>

              <h2 className="mt-5 text-[44px] font-bold leading-[110%] tracking-[-0.02em] text-[#0F172A] sm:text-[48px]">
                ¿Por qué vender con<br />{agency.nombre_comercial} y no<br />con otra inmobiliaria?
              </h2>

              <div className="mt-6 h-1 w-16 rounded-full bg-primary" />

              <p className="mt-6 max-w-[520px] text-lg leading-[170%] text-[#68707F]">
                Combinamos experiencia local, transparencia y tecnología para ayudarte a vender mejor tu propiedad.
              </p>

              <div className="mt-10">
                <WhyUsGrid />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bloque 3 — mapa a la izquierda, reseñas a la derecha */}
      <section className="bg-white">
        <div className="relative mx-auto max-w-[1400px] px-6 py-16 sm:py-24">
          <div className={`grid grid-cols-1 gap-10 ${agency.lat != null && agency.lng != null ? 'lg:grid-cols-[3fr_2fr] lg:gap-[72px]' : ''}`}>
            {agency.lat != null && agency.lng != null && (
              <div>
                <LocationSection agency={agency} searchPoint={searchPoint} />
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
        <Footer />
      </section>

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
