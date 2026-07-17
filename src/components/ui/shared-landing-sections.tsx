import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { Youtube, Play, X, Users, MapPin, Calendar, Check } from 'lucide-react';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

export function AnimatedCounter({
  target,
  suffix = '',
  prefix = '',
  duration = 2000,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration]);

  return (
    <span ref={ref}>
      {prefix}{count}{suffix}
    </span>
  );
}

export function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.65, ease: EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function FadeUp({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
      animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
      transition={{ duration: 0.7, ease: EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function VideoModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-3xl overflow-hidden rounded-xl shadow-2xl"
          initial={{ opacity: 0, scale: 0.95, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.4, ease: EXPO }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
              title="Cosiris YouTube Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar video"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-black/90"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

const VIDEOS = [
  {
    id: 'GdQ62okgfNM',
    title: 'Cómo captar vendedores con un embudo digital automatizado',
    guest: 'David Farlete',
    duration: '42 min',
    tag: 'Podcast',
    color: 'from-slate-800 to-slate-900',
  },
  {
    id: 'pUM7kt0Tcwk',
    title: 'El sistema de captación que nadie enseña en inmobiliario',
    guest: 'David Farlete',
    duration: '38 min',
    tag: 'Entrevista',
    color: 'from-orange-900 to-slate-900',
  },
  {
    id: 'RRMdW8X_mPo',
    title: 'Por qué el buzoneo ya no funciona y qué hacer en su lugar',
    guest: 'David Farlete',
    duration: '55 min',
    tag: 'Estrategia',
    color: 'from-slate-900 to-orange-950',
  },
];

export function VideoCard({
  video,
  onPlay,
  disabled = false,
}: {
  video: (typeof VIDEOS)[0];
  onPlay: () => void;
  disabled?: boolean;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className={`group relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
        disabled ? 'cursor-default opacity-90 grayscale-[0.3]' : 'cursor-pointer transition-shadow hover:shadow-lg'
      }`}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => !disabled && setHovered(false)}
      onClick={() => !disabled && onPlay()}
      whileHover={disabled ? {} : { y: -4 }}
      transition={{ duration: 0.3, ease: EXPO }}
    >
      <div className={`relative aspect-video w-full bg-gradient-to-br ${video.color} overflow-hidden`}>
        <img
          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 flex items-end p-4">
          <span className="rounded bg-[#FF8000] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            {video.tag}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8000] shadow-lg"
            animate={{ scale: hovered ? 1.12 : 1, opacity: hovered ? 1 : 0.85 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Play size={22} fill="white" strokeWidth={0} className="ml-0.5 text-white" />
          </motion.div>
        </div>
        <span className="absolute right-3 bottom-3 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
          {video.duration}
        </span>
      </div>

      <div className="p-5">
        <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8000]">
          {video.guest}
        </p>
        <h3 className="text-sm font-bold leading-snug tracking-tight text-slate-900 line-clamp-2">
          {video.title}
        </h3>
        <div className="mt-3 flex items-center gap-2">
          <Youtube size={13} className="text-red-500" />
          <span className="text-[11px] text-slate-400">Ver en YouTube</span>
        </div>
      </div>
    </motion.div>
  );
}

const TESTIMONIALS = [
  {
    quote: 'La calidad del lead ha sido el mayor cambio que he notado respecto a otras agencias. Los clientes contestan las llamadas, recuerdan haber enviado el lead y con algunos agendamos visitas. Captar o no ya es trabajo nuestro.',
    author: 'Diego',
    role: 'Inmobiliaria Capital',
    logo: 'https://madrizcapital.com/wp-content/uploads/2025/03/Logo-Capital-verde-final-redondo.png',
  },
  {
    quote: 'El acompañamiento durante el proceso es una de las cosas que más valoramos.',
    author: 'Nerea',
    role: 'DSS servicios inmobiliarios',
    logo: 'https://www.dssinmo.com/img/header/logo.png',
  },
  {
    quote: 'Hacía 11 años había sido mi comercial y volvimos a contratar con él y ya hemos captado alguna propiedad. Los resultados son buenos.',
    author: 'Pep',
    role: 'Habitat nou',
    logo: 'https://media.egorealestate.com/ORIGINAL/abed00ed-61f1-454c-8e93-2cce127bf5c5.png',
  },
];

export function SharedLandingSections({ disableYouTube = false }: { disableYouTube?: boolean } = {}) {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  return (
    <>
      {/* 3. Trayectoria */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {[
            {
              icon: <Users size={24} className="text-[#FF8000]" />,
              title: 'Trayectoria real',
              checks: [
                'Especializados en el sector inmobiliario',
                'Más de 11 años de experiencia',
                'Visitando a inmobiliarias de toda España',
              ],
              delay: 0,
            },
            {
              icon: <MapPin size={24} className="text-[#FF8000]" />,
              title: 'Servicios',
              subtitle: 'Un único proveedor todos los servicios relacionados con lo digital:',
              checks: [
                'Gestión de redes',
                'Captación de leads',
                'Email marketing',
                'Automatizaciones IA',
              ],
              delay: 0.1,
            },
            {
              icon: <Calendar size={24} className="text-[#FF8000]" />,
              title: 'Condiciones de pago',
              subtitle: 'La fidelidad tiene premio:',
              checks: [
                'Sin permanencias',
                'Sin pagos por adelantado',
              ],
              delay: 0.2,
            },
          ].map((card) => (
            <FadeIn key={card.title} delay={card.delay}>
              <div className="group relative flex h-full flex-col rounded-2xl border border-slate-100 bg-white p-10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] transition-all duration-300 hover:border-[#FF8000]/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
                <div className="mb-7 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#FF8000] transition-colors group-hover:text-white">
                  {card.icon}
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
                  {card.title}
                </h3>
                {card.subtitle && (
                  <p className="mt-2 mb-6 text-[13px] font-semibold leading-relaxed text-slate-500">
                    {card.subtitle}
                  </p>
                )}
                {!card.subtitle && <div className="h-6" />}
                <ul className="flex-1 space-y-4">
                  {card.checks.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF8000]/10 text-[#FF8000]">
                        <Check size={10} strokeWidth={4} />
                      </div>
                      <span className="text-[14px] font-medium leading-relaxed text-slate-600">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 4. Social Proof */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12 md:py-16">
        <FadeUp>
          <p className="mb-8 text-[10px] font-bold uppercase tracking-[0.28em] text-slate-400">
            Clientes reales, resultados reales.
          </p>
        </FadeUp>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <FadeUp key={t.author} delay={i * 0.1}>
              <figure className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm flex flex-col justify-between h-full">
                <blockquote className="text-sm leading-relaxed text-slate-700 font-medium italic flex-1">
                  "{t.quote}"
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="flex h-12 w-24 shrink-0 items-center justify-center bg-transparent overflow-hidden">
                    {t.logo ? (
                      <img src={t.logo} alt={t.role} className="w-full h-full object-contain" />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FF8000]/10 text-xs font-bold text-[#FF8000] overflow-hidden">
                        {t.author[0]}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.author}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </figcaption>
              </figure>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* 5. Youtube */}
      <section className="mx-auto w-full max-w-5xl px-6 py-12 md:py-20">
        <FadeIn>
          <div className="mb-14 max-w-2xl">
            <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
              Canal de YouTube
            </span>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">
              Aportamos valor real al sector.
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VIDEOS.map((video, i) => (
            <FadeIn key={video.id + i} delay={i * 0.1}>
              <VideoCard video={video} onPlay={() => setActiveVideo(video.id)} disabled={disableYouTube} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* 6. Stats */}
      <section className="bg-slate-50 py-16 mt-8 w-full">
        <div className="mx-auto max-w-5xl px-6 border-y border-slate-100 py-12 md:py-16">
          <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3">
            {[
              { target: 11, prefix: '+', suffix: '', label: 'Años de experiencia real' },
              { target: 1000, prefix: '+', suffix: '', label: 'Inmobiliarias Visitadas' },
              { target: 100, prefix: '', suffix: '%', label: 'Enfoque en captación de vendedores' },
            ].map((stat, i) => (
              <FadeIn key={stat.label} delay={i * 0.12}>
                <p className="text-5xl font-black tracking-tighter text-slate-900 md:text-6xl">
                  <AnimatedCounter
                    target={stat.target}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                  />
                </p>
                <p className="mt-2 text-sm font-medium leading-snug text-slate-500">{stat.label}</p>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideo} />}
    </>
  );
}