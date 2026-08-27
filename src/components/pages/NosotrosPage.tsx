import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { X, Play, Youtube, MapPin, Calendar, Users, Check, Volume2, VolumeX } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/lib/seo';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

// ─── Interactive Dot Grid ─────────────────────────────────────────────────────

function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const SPACING = 28;
    const RADIUS = 1.5;
    const EFFECT_RADIUS = 120;
    const MAX_SCALE = 3.5;

    let cols = 0;
    let rows = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.ceil(canvas.width / SPACING) + 1;
      rows = Math.ceil(canvas.height / SPACING) + 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING;
          const y = r * SPACING;
          const dx = mx - x;
          const dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = dist < EFFECT_RADIUS
            ? 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / EFFECT_RADIUS, 2)
            : 1;
          const alpha = dist < EFFECT_RADIUS
            ? 0.13 + 0.45 * Math.pow(1 - dist / EFFECT_RADIUS, 1.5)
            : 0.13;

          ctx.beginPath();
          ctx.arc(x, y, RADIUS * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(15,23,42,${alpha})`;
          ctx.fill();
        }
      }
      rafId.current = requestAnimationFrame(draw);
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseleave', onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function AnimatedCounter({
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

// ─── Fade In wrapper ──────────────────────────────────────────────────────────

function FadeIn({
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

// ─── Video Modal ──────────────────────────────────────────────────────────────

function VideoModal({ videoId, onClose }: { videoId: string; onClose: () => void }) {
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

// ─── Video Card ───────────────────────────────────────────────────────────────

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

function VideoCard({
  video,
  onPlay,
}: {
  video: (typeof VIDEOS)[0];
  onPlay: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlay}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: EXPO }}
    >
      {/* Thumbnail */}
      <div className={`relative aspect-video w-full bg-gradient-to-br ${video.color} overflow-hidden`}>
        {/* YouTube thumbnail (uses real thumbnail if video ID is valid) */}
        <img
          src={`https://img.youtube.com/vi/${video.id}/mqdefault.jpg`}
          alt={video.title}
          className="absolute inset-0 h-full w-full object-cover opacity-60"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        {/* Cosiris watermark */}
        <div className="absolute inset-0 flex items-end p-4">
          <span className="rounded bg-[#FF8000] px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white">
            {video.tag}
          </span>
        </div>
        {/* Play button */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF8000] shadow-lg"
            animate={{ scale: hovered ? 1.12 : 1, opacity: hovered ? 1 : 0.85 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <Play size={22} fill="white" strokeWidth={0} className="ml-0.5 text-white" />
          </motion.div>
        </div>
        {/* Duration */}
        <span className="absolute right-3 bottom-3 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-mono text-white">
          {video.duration}
        </span>
      </div>

      {/* Info */}
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

// ─── Cinematic Video ──────────────────────────────────────────────────────────

function CinematicVideo({ videoId }: { videoId: string }) {
  const [isMuted, setIsMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  const toggleMute = () => {
    if (!iframeRef.current?.contentWindow) return;
    setIsMuted(!isMuted);
    const command = isMuted ? 'unMute' : 'mute';
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: command, args: [] }),
      '*'
    );
  };
  
  return (
    <>
      <iframe
        ref={iframeRef}
        className="pointer-events-none h-full w-full scale-[1.10] transform border-0"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Cinematic Hero Video"
      />
      <button
        onClick={toggleMute}
        aria-label={isMuted ? "Activar Sonido" : "Silenciar"}
        className="absolute bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-all duration-300 hover:bg-[#FF8000] hover:scale-105 shadow-xl border border-white/10"
      >
        {isMuted ? <VolumeX className="h-6 w-6" /> : <Volume2 className="h-6 w-6" />}
      </button>
      {/* Subtle overlay gradient to blend bottom edge if needed */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent" />
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function NosotrosPage() {
  useSEO({
    path: '/nosotros',
    title: 'Sobre Cosiris | Agencia de marketing inmobiliario',
    description: 'Conoce al equipo detrás de Cosiris y cómo ayudamos a inmobiliarias a captar y digitalizar su negocio con un sistema, no con suerte.',
  });

  const { openContactModal } = useUI();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  // Reset scroll on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <DotGrid />
        {/* Subtle vertical lines (same as homepage) */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-transparent via-slate-200 to-slate-200 md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-slate-200 to-slate-200 md:right-8" />
        </div>
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.55, ease: EXPO }}
          >
            <span className="mb-6 inline-block rounded-full border border-[#FF8000]/30 bg-[#FF8000]/8 px-4 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
              NUESTRA DIFERENCIA
            </span>
          </motion.div>

          <motion.h1
            className="mt-4 text-4xl font-black leading-tight tracking-tighter text-slate-900 md:text-6xl"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: EXPO, delay: 0.1 }}
          >
            Marketing y Agentes de IA especializados{" "}
            <span className="text-[#FF8000] block md:inline">en inmobiliarias.</span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: EXPO, delay: 0.2 }}
          >
            No aplicamos fórmulas mágicas; aplicamos soluciones reales y digitales que ayudan a mejorar los problemas diarios con los que convive una inmobiliaria.
          </motion.p>
        </div>
      </section>

      {/* ── CINEMATIC VIDEO SECTION ────────────────────────────────────────── */}
      <section className="relative z-20 pb-20 md:pb-28 px-4 sm:px-6">
        <motion.div 
          className="mx-auto max-w-7xl relative"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: EXPO }}
        >
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl md:rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] bg-slate-900 group">
            <CinematicVideo videoId="rzu0PMyuHjM" />
          </div>
          
          <div className="mt-12 flex justify-center">
            <button
              onClick={() => openContactModal({ sourceContext: 'nosotros_video' })}
              className="inline-flex items-center justify-center rounded-md bg-[#FF8000] px-8 py-4 text-sm font-bold uppercase tracking-[0.14em] text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-[#E67300] hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000]"
            >
              Quiero más información
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── AUTHORITY CARDS ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
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
              subtitle: 'Un único proveedor todos los servicios relacionados con lo digital',
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

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="border-y border-slate-100 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid grid-cols-1 gap-10 text-center md:grid-cols-3">
            {[
              { target: 11, prefix: '+', suffix: '', label: 'Años de experiencia real' },
              { target: 1000, prefix: '+', suffix: '', label: 'Inmobiliarias Visitadas' },
              { target: 100, prefix: '', suffix: '%', label: 'Digitalizamos tu negocio' },
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

      {/* ── YOUTUBE SECTION ──────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <FadeIn>
          <div className="mb-14 max-w-2xl">
            <span className="mb-3 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
              Canal de YouTube
            </span>
            <h2 className="text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">
              Aportamos valor real al sector.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-600">
              Creemos en un marketing transparente. En nuestro canal compartimos estrategias,
              entrevistas y la realidad del mercado sin filtros. Realizamos grabaciones periódicas con clientes en nuestro podcast inmobiliario donde seguro te verás reflejado.
            </p>
            <p className="mt-4 text-sm font-medium text-slate-800 bg-[#FF8000]/10 p-4 rounded-lg border border-[#FF8000]/20">
              🎙️ ¿Te gustaría asistir, tienes algo que contar o quieres nominar a alguien para que le hagamos una entrevista en directo?{' '}
              <button
                onClick={() => openContactModal({ sourceContext: 'youtube_podcast_guest' })}
                className="text-[#FF8000] underline font-bold hover:text-[#E67300] transition-colors"
              >
                Contáctanos
              </button>
            </p>
            <a
              href="https://www.youtube.com/@cosiris_inv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:border-[#FF8000] hover:text-[#FF8000]"
            >
              <Youtube size={16} className="text-red-500" />
              Ver canal completo
            </a>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {VIDEOS.map((video, i) => (
            <FadeIn key={video.id + i} delay={i * 0.1}>
              <VideoCard video={video} onPlay={() => setActiveVideo(video.id)} />
            </FadeIn>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#FF8000] md:mx-12">
        <FadeIn>
          <div className="relative px-10 py-16 text-center md:py-20">
            {/* Decorative circles */}
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-12 h-80 w-80 rounded-full bg-white/8" />

            <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
              Siguiente paso
            </p>
            <h2 className="relative text-3xl font-black tracking-tighter text-white md:text-4xl">
              Si quieres captar mejor y crecer con sistema, hablemos.
            </h2>
            <p className="relative mt-4 text-base leading-relaxed text-white/80">
              Te enseñamos cómo aplicar una estrategia adaptada a tu zona.
            </p>
            <button
              onClick={() => openContactModal({ sourceContext: 'nosotros_cta' })}
              className="relative mt-8 inline-flex items-center gap-2 rounded-md bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#FF8000] shadow-md transition-all duration-300 hover:bg-slate-50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Quiero más información
            </button>
          </div>
        </FadeIn>
      </section>

      <Footer />

      {/* Video Modal */}
      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideo} />}
    </div>
  );
}
