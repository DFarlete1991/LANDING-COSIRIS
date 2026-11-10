import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';
import { ArrowRight, Calendar, Check, Layers, Mic, Play, TrendingUp, Volume2, VolumeX, Youtube } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { VideoModal } from '@/components/ui/shared-landing-sections';
import { SwipeRow } from '@/components/ui/swipe-row';
import { TeamVideo } from '@/components/ui/team-video';
import { useSEO } from '@/lib/seo';
import { useFluidPage } from '@/lib/use-fluid-page';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];
const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';
const WRAP = 'mx-auto w-full max-w-[87.5rem] px-5 md:px-10';
const EYEBROW = 'text-[13px] font-bold text-[#C2410C]';
const TITLE = 'text-3xl font-extrabold leading-[1.1] tracking-tight md:text-[2.75rem]';
const BODY = 'text-base leading-relaxed text-neutral-600';
const PRIMARY = `inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#FF8000] px-6 text-sm font-bold text-white transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#E67300] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`;

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: reduced ? 0 : 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const withDots = (n: number) => String(n).replace(/\B(?=(\d{3})+$)/g, '.');

function Counter({ target, prefix = '', suffix = '' }: { target: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const [value, setValue] = useState(reduced ? target : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(0, target, { duration: 1.4, ease: EXPO, onUpdate: (v) => setValue(Math.round(v)) });
    return () => controls.stop();
  }, [inView, reduced, target]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {withDots(value)}
      {suffix}
    </span>
  );
}

// Vídeo de presentación: arranca en silencio y se activa el sonido con el botón.
function CinematicVideo({ videoId }: { videoId: string }) {
  const [muted, setMuted] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleMute = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      JSON.stringify({ event: 'command', func: muted ? 'unMute' : 'mute', args: [] }),
      'https://www.youtube.com',
    );
    setMuted(!muted);
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-[0_16px_40px_rgba(0,0,0,0.14)] md:rounded-3xl">
      <iframe
        ref={iframeRef}
        className="pointer-events-none h-full w-full scale-[1.1] border-0"
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&playsinline=1`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Cosiris: agencia de marketing para inmobiliarias"
      />
      <button
        type="button"
        onClick={toggleMute}
        aria-label={muted ? 'Activar sonido' : 'Silenciar'}
        className={`absolute right-3 bottom-3 flex size-11 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#FF8000] active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white md:right-5 md:bottom-5 md:size-12`}
      >
        {muted ? <VolumeX size={20} aria-hidden="true" /> : <Volume2 size={20} aria-hidden="true" />}
      </button>
    </div>
  );
}

const STATS = [
  { target: 11, prefix: '+', label: 'Años de experiencia real' },
  { target: 1000, prefix: '+', label: 'Inmobiliarias visitadas' },
  { target: 100, suffix: '%', label: 'Digitalizamos tu negocio' },
];

const PILLARS = [
  {
    icon: TrendingUp,
    title: 'Trayectoria real',
    checks: ['Especializados en el sector inmobiliario', 'Más de 11 años de experiencia', 'Visitando a inmobiliarias de toda España'],
  },
  {
    icon: Layers,
    title: 'Servicios',
    subtitle: 'Un único proveedor para todo lo digital',
    checks: ['Gestión de redes', 'Captación de leads', 'Email marketing', 'Automatizaciones IA'],
  },
  {
    icon: Calendar,
    title: 'Condiciones de pago',
    checks: ['Sin pagos por adelantado', 'La fidelidad tiene premio'],
  },
];

const VIDEOS = [
  { id: 'GdQ62okgfNM', title: 'Por qué vender tu piso por tu cuenta suele salir caro', agency: 'DSS Inmobiliaria' },
  { id: 'pUM7kt0Tcwk', title: 'Cómo una inmobiliaria de barrio está construyendo una marca', agency: 'MUNDOCASA' },
  { id: 'RRMdW8X_mPo', title: 'Vendieron un piso en 20 minutos (sin trucos ni promesas mágicas)', agency: 'CS Gestiones' },
];

export function NosotrosPage() {
  useFluidPage();

  useSEO({
    path: '/nosotros',
    title: 'Sobre Cosiris | Agencia de marketing inmobiliario',
    description: 'Conoce al equipo detrás de Cosiris y cómo ayudamos a inmobiliarias a captar y digitalizar su negocio con un sistema, no con suerte.',
  });

  const { openContactModal } = useUI();
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-black antialiased">
      <LandingNavbar />

      {/* Portada: el mensaje y el vídeo en la primera pantalla. */}
      <section className={`${WRAP} grid grid-cols-[minmax(0,1fr)] items-center gap-6 pt-6 pb-8 md:pt-20 md:pb-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-14`}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
          <p className={EYEBROW}>Nuestra diferencia</p>
          <h1 className="mt-2 text-4xl font-extrabold leading-[1.06] tracking-tight md:text-[3.25rem]">
            Marketing y Agentes de IA especializados <span className="text-[#E67300]">en inmobiliarias.</span>
          </h1>
          <p className={`mt-4 max-w-xl ${BODY} md:text-lg`}>
            No aplicamos fórmulas mágicas; aplicamos soluciones reales y digitales que ayudan a mejorar los problemas diarios con los que convive una inmobiliaria.
          </p>
          <button type="button" onClick={() => openContactModal({ sourceContext: 'nosotros_video' })} className={`mt-5 md:mt-7 ${PRIMARY}`}>
            Quiero más información
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO, delay: 0.1 }}>
          <CinematicVideo videoId="rzu0PMyuHjM" />
        </motion.div>
      </section>

      {/* Cifras */}
      <section className="bg-[#FFF8F1]">
        <dl className={`${WRAP} grid grid-cols-3 divide-x divide-[#FFD3A1] py-6 md:py-10`}>
          {STATS.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.08} className="px-2 text-center md:px-6">
              <dd className="text-2xl font-extrabold tracking-tight text-[#E67300] md:text-5xl">
                <Counter target={s.target} prefix={s.prefix} suffix={s.suffix} />
              </dd>
              <dt className="mt-1 text-[11px] font-medium leading-tight text-neutral-600 md:text-sm">{s.label}</dt>
            </FadeUp>
          ))}
        </dl>
      </section>

      {/* El equipo */}
      <section className={`${WRAP} grid grid-cols-[minmax(0,1fr)] items-center gap-6 py-10 md:py-20 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-16`}>
        <FadeUp className="order-2 mx-auto w-full max-w-[14rem] md:max-w-[18rem] lg:order-1 lg:w-[18rem]">
          <TeamVideo />
        </FadeUp>

        <div className="order-1 lg:order-2">
          <FadeUp>
            <p className={EYEBROW}>Quiénes somos</p>
            <h2 className={`mt-2 ${TITLE}`}>
              Un equipo que conoce <span className="text-[#E67300]">tu día a día.</span>
            </h2>
          </FadeUp>
          <div className="mt-6 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-3 md:gap-8">
            {PILLARS.map((p, i) => (
              <FadeUp key={p.title} delay={i * 0.08} className="border-t-2 border-[#FF8000] pt-4">
                <p.icon size={22} aria-hidden="true" className="text-[#E67300]" />
                <h3 className="mt-2 text-lg font-extrabold tracking-tight">{p.title}</h3>
                {p.subtitle && <p className="mt-0.5 text-[13px] font-semibold leading-snug text-neutral-600">{p.subtitle}</p>}
                <ul className="mt-3 space-y-1.5">
                  {p.checks.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm leading-snug text-neutral-700">
                      <Check size={15} strokeWidth={3} aria-hidden="true" className="mt-0.5 shrink-0 text-[#E67300]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* Canal de YouTube */}
      <section className="mx-auto w-full max-w-[87.5rem] px-3 md:px-10">
        <FadeUp>
          <div className="rounded-3xl bg-[#0A0A0A] p-5 text-white md:p-10 lg:p-12">
            <div className="grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-2 lg:gap-12">
              <div>
                <p className="text-[13px] font-bold text-[#FFB877]">Canal de YouTube</p>
                <h2 className={`mt-2 ${TITLE}`}>
                  Aportamos valor real <span className="text-[#FF8000]">al sector.</span>
                </h2>
              </div>
              <div className="lg:self-end">
                <p className="text-base leading-relaxed text-neutral-300">
                  Creemos en un marketing transparente. En nuestro canal compartimos estrategias, entrevistas y la realidad del mercado sin filtros. Realizamos grabaciones periódicas con clientes en nuestro podcast inmobiliario donde seguro te verás reflejado.
                </p>
              </div>
            </div>

            <SwipeRow
              dark
              label="Vídeos del canal"
              arrowsClassName="md:hidden"
              className="-mx-5 mt-5 scroll-pl-5 px-5 md:mx-0 md:mt-8 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:[&>li]:w-auto md:[&>li]:max-w-none"
            >
              {VIDEOS.map((v) => (
                <li key={v.id}>
                  <button
                    type="button"
                    onClick={() => setActiveVideo(v.id)}
                    aria-label={`Ver vídeo: ${v.title}`}
                    className="group block w-full cursor-pointer text-left focus-visible:outline-none"
                  >
                    <span className="relative block aspect-video overflow-hidden rounded-2xl bg-neutral-800 group-focus-visible:ring-2 group-focus-visible:ring-[#FF8000]">
                      <img
                        src={`https://img.youtube.com/vi/${v.id}/hqdefault.jpg`}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={480}
                        height={360}
                        className={`h-full w-full object-cover transition-transform duration-300 ${SNAPPY} [@media(hover:hover)]:group-hover:scale-[1.03]`}
                      />
                      <span className="absolute right-3 bottom-3 flex size-11 items-center justify-center rounded-full bg-[#FF8000] text-white">
                        <Play size={16} fill="currentColor" strokeWidth={0} className="ml-0.5" />
                      </span>
                    </span>
                    <span className="mt-3 block text-[15px] font-bold leading-snug tracking-tight">{v.title}</span>
                    <span className="mt-0.5 block text-[13px] text-neutral-300">{v.agency}</span>
                  </button>
                </li>
              ))}
            </SwipeRow>

            <div className="mt-6 flex flex-col gap-4 border-t border-white/15 pt-5 md:mt-8 md:flex-row md:items-center md:justify-between md:pt-6">
              <p className="flex items-start gap-3 text-[15px] leading-snug text-neutral-200">
                <Mic size={20} aria-hidden="true" className="mt-0.5 shrink-0 text-[#FF8000]" />
                <span>
                  ¿Te gustaría asistir, tienes algo que contar o quieres nominar a alguien para que le hagamos una entrevista en directo?{' '}
                  <button
                    type="button"
                    onClick={() => openContactModal({ sourceContext: 'youtube_podcast_guest' })}
                    className="cursor-pointer font-bold text-[#FF8000] underline underline-offset-4 hover:text-[#FFB877] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
                  >
                    Contáctanos
                  </button>
                </span>
              </p>
              <a
                href="https://www.youtube.com/@cosiris_inv"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/30 px-6 text-sm font-bold text-white transition-colors duration-150 hover:border-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
              >
                <Youtube size={18} aria-hidden="true" />
                Ver canal completo
              </a>
            </div>
          </div>
        </FadeUp>
      </section>

      {/* Cierre */}
      <section className="mx-auto mt-3 mb-10 w-full max-w-[87.5rem] px-3 md:mt-4 md:mb-16 md:px-10">
        <FadeUp>
          <div className="flex flex-col items-start gap-5 rounded-3xl bg-[#FF8000] p-6 md:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                Si quieres captar mejor y crecer con sistema, hablemos.
              </h2>
              <p className="mt-2 text-base leading-relaxed text-white">Te enseñamos cómo aplicar una estrategia adaptada a tu zona.</p>
            </div>
            <button
              type="button"
              onClick={() => openContactModal({ sourceContext: 'nosotros_cta' })}
              className={`inline-flex min-h-12 w-full shrink-0 cursor-pointer items-center justify-center rounded-lg bg-white px-7 text-sm font-bold text-black transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#FFF0E5] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF8000] sm:w-auto`}
            >
              Quiero más información
            </button>
          </div>
        </FadeUp>
      </section>

      <Footer />

      {activeVideo && <VideoModal videoId={activeVideo} onClose={closeVideo} />}
    </div>
  );
}
