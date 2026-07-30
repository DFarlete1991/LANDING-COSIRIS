import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Bot,
  Check,
  Inbox,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Search,
  ShieldCheck,
  Target,
  TrendingUp,
  User,
  UserPlus,
  Zap,
} from 'lucide-react';
import { AgencySearchBar, type SearchSuggestion } from '../../ui/AgencySearchBar';
import { getAllCitiesWithCounts, getNearbyCities } from '@/data/fixed-cities';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { navigateTo } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

export function InmobiliariasHomeView({ onSearch }: { onSearch: (s: SearchSuggestion) => void }) {
  const { agencies } = useInmobiliarias();
  const allCities = useMemo(() => getAllCitiesWithCounts(agencies), [agencies]);
  const rowA = agencies.slice(0, Math.ceil(agencies.length / 2));
  const rowB = agencies.slice(Math.ceil(agencies.length / 2));

  const VIDEO_COUNT = 3;
  const shuffledForVideo = useMemo(() => [...agencies].sort(() => Math.random() - 0.5), [agencies]);
  const [videoStartIdx, setVideoStartIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setVideoStartIdx((prev) => (prev + 1) % shuffledForVideo.length), 8000);
    return () => clearInterval(t);
  }, [shuffledForVideo.length]);

  const visibleForVideo = useMemo(() => {
    const result: typeof agencies = [];
    for (let i = 0; i < VIDEO_COUNT; i++) {
      result.push(shuffledForVideo[(videoStartIdx + i) % shuffledForVideo.length]);
    }
    return result;
  }, [shuffledForVideo, videoStartIdx]);

  const [toast, setToast] = useState<{ city: string; nearby: string[] } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCityClick = (c: (typeof allCities)[number]) => {
    if (c.count === 0) {
      const nearby = getNearbyCities(c.city);
      setToast({ city: c.city, nearby });
      return;
    }
    onSearch({ label: `${c.city}, ${c.province}`, lat: c.lat, lng: c.lng });
  };

  const STEPS = [
    { icon: User, title: 'Un propietario quiere vender su vivienda.' },
    { icon: Search, title: 'Encuentra tu inmobiliaria en Cosiris.' },
    { icon: Inbox, title: 'La solicitud llega automáticamente a tu CRM.' },
    { icon: Bot, title: 'Cosiris automatiza el seguimiento.' },
    { icon: TrendingUp, title: 'Tu equipo se concentra en vender.' },
    { icon: Target, title: 'Más captaciones. Más ventas. Menos trabajo manual.' },
  ];

  const [storyStep, setStoryStep] = useState(-1);
  const [storyComplete, setStoryComplete] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storyStep >= STEPS.length - 1) {
      setStoryComplete(true);
      return;
    }
    const t = setTimeout(() => setStoryStep((p) => p + 1), 700);
    return () => clearTimeout(t);
  }, [storyStep, STEPS.length]);

  const [storyStarted, setStoryStarted] = useState(false);
  useEffect(() => {
    const el = storyRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !storyStarted) {
          setStoryStarted(true);
          setStoryStep(0);
        }
      },
      { threshold: 0.3 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [storyStarted]);

  return (
    <div>
      {/* HERO — video de fondo real, overlay oscuro + buscador */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 text-center text-white sm:min-h-[78vh] sm:pb-28 sm:pt-28">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src="/assets/inmobiliarias/hero-bg.mp4"
            poster="/assets/inmobiliarias/ciudades/madrid.jpg"
            autoPlay muted loop playsInline
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/60 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF8000]/5 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-2xl"
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#FF8000] sm:text-[10px]">Directorio Cosiris</p>
          <h1 className="mt-3 text-2xl font-black leading-[1.1] tracking-[-0.03em] sm:text-3xl md:text-5xl">
            Encuentra la inmobiliaria ideal en tu zona
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-xs text-white/85 sm:mt-4 sm:text-sm md:text-base">
            Conectamos personas con inmobiliarias reales, cercanas y de confianza en toda España.
          </p>

          <div className="mt-8">
            <AgencySearchBar size="hero" onSelect={onSearch} placeholder="Ej. Madrid, Ruzafa Valencia..." />
          </div>

          {allCities.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
              <span className="hidden text-xs text-white/50 sm:inline">Ciudades:</span>
              {allCities.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => handleCityClick(c)}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md transition-all duration-200 hover:border-[#FF8000] hover:bg-[#FF8000]/15 hover:text-white active:scale-95 sm:px-3 sm:text-xs"
                >
                  {c.city}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* 1. LOGO CARRUSEL — dos filas en direcciones opuestas */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="mb-10 text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Inmobiliarias que confían en Cosiris
            </p>
            <div className="space-y-4">
              <div
                className="relative overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                }}
              >
                <div className="animate-marquee flex w-max gap-5" style={{ animationDuration: `${rowA.length * 5}s` }}>
                  {[...rowA, ...rowA].map((agency, i) => (
                    <div
                      key={`${agency.id}-${i}`}
                      className="flex h-14 w-44 shrink-0 items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 shadow-sm shadow-slate-900/5"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: agency.color_hex ?? '#FF8000' }}
                      >
                        {agency.nombre_comercial.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                      <span className="truncate text-sm font-semibold text-slate-700">
                        {agency.nombre_comercial}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div
                className="relative overflow-hidden"
                style={{
                  maskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                  WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                }}
              >
                <div className="animate-marquee-reverse flex w-max gap-5" style={{ animationDuration: `${rowB.length * 5}s` }}>
                  {[...rowB, ...rowB].map((agency, i) => (
                    <div
                      key={`${agency.id}-${i}`}
                      className="flex h-14 w-44 shrink-0 items-center gap-3 rounded-xl border border-slate-100 bg-white px-4 shadow-sm shadow-slate-900/5"
                    >
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: agency.color_hex ?? '#FF8000' }}
                      >
                        {agency.nombre_comercial.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                      </div>
                      <span className="truncate text-sm font-semibold text-slate-700">
                        {agency.nombre_comercial}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 2. VIDEO SHOWCASE — cards verticales que rotan cada 5s */}
      <section className="relative overflow-hidden bg-black py-20 sm:py-28">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover opacity-15"
            src="/assets/inmobiliarias/hero-bg.mp4"
            poster="/assets/inmobiliarias/ciudades/madrid.jpg"
            autoPlay muted loop playsInline
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-4">
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
              Conoce a nuestras inmobiliarias
            </p>
          </Reveal>

          <div className="mt-10 flex items-end justify-center gap-3 sm:gap-4 md:gap-5 lg:gap-6">
            {visibleForVideo.map((agency, i) => (
              <AnimatePresence mode="wait" key={`pos-${i}`}>
                <motion.button
                  key={agency.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -24 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  onClick={() => navigateTo(`/inmobiliarias/${agency.id}`)}
                  className="group relative w-48 shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/40 transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] sm:w-56 md:w-72 lg:w-80"
                  style={{ aspectRatio: '9/16' }}
                >
                  <video
                    className="absolute inset-0 h-full w-full object-cover"
                    src={agency.media_presentacion_url ?? '/assets/inmobiliarias/hero-bg.mp4'}
                    poster="/assets/inmobiliarias/ciudades/madrid.jpg"
                    autoPlay muted loop playsInline
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-left sm:p-4">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold text-white sm:h-10 sm:w-10 sm:text-sm"
                      style={{ backgroundColor: agency.color_hex ?? '#FF8000' }}
                    >
                      {agency.nombre_comercial.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
                    </div>
                    <h3 className="mt-2 text-xs font-bold text-white sm:text-sm">{agency.nombre_comercial}</h3>
                    <p className="mt-0.5 text-[10px] text-white/50 sm:text-xs">{agency.poblacion}</p>
                  </div>
                  <div className="absolute right-2 top-2 rounded-full bg-black/40 px-1.5 py-0.5 text-[10px] font-semibold text-white/70 backdrop-blur-sm">
                    {(videoStartIdx + i) % shuffledForVideo.length + 1}/{shuffledForVideo.length}
                  </div>
                </motion.button>
              </AnimatePresence>
            ))}
          </div>
        </div>
      </section>

      {/* 3. PARA INMOBILIARIAS — storytelling + beneficios + funcionalidades */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          {/* HEADER */}
          <Reveal>
            <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
              Para inmobiliarias
            </p>
            <h2 className="mx-auto mt-3 max-w-2xl text-center text-3xl font-black leading-[1.1] tracking-[-0.02em] text-[#0F172A] sm:text-4xl md:text-5xl">
              Todo lo que tu inmobiliaria necesita para crecer
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-relaxed text-slate-500 sm:text-base">
              Desde aparecer en nuestro directorio hasta automatizar el seguimiento de cada cliente. Todo desde una única plataforma.
            </p>
          </Reveal>

          {/* ¿POR QUÉ CONFIAR? */}
          <Reveal delay={0.05}>
            <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
              <p className="text-sm leading-relaxed text-slate-600">
                <span className="font-bold text-[#0F172A]">No somos una inmobiliaria.</span>{' '}
                Somos una plataforma que conecta propietarios con inmobiliarias verificadas y proporciona herramientas para captar, organizar y convertir más clientes.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, label: 'Directorio verificado', desc: 'Solo inmobiliarias verificadas.' },
                  { icon: MapPin, label: 'Captación local', desc: 'Propietarios reales de tu zona.' },
                  { icon: Zap, label: 'Tecnología', desc: 'CRM, IA y automatizaciones en una única plataforma.' },
                ].map(({ icon: Icon, label, desc }) => (
                  <div key={label} className="flex items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF8000]/10 text-[#FF8000]">
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F172A]">{label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>

          {/* STORYTELLING + MOCKUP */}
          <div ref={storyRef} className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
                  Cómo funciona
                </p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#0F172A] sm:text-2xl">
                  El recorrido del propietario hasta tu inmobiliaria
                </h3>
              </Reveal>

              <div className="mt-8 space-y-0">
                {STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 16, height: 0 }}
                      animate={
                        storyStep >= i
                          ? { opacity: 1, y: 0, height: 'auto' }
                          : { opacity: 0, y: 16, height: 0 }
                      }
                      transition={{ duration: 0.35, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-start gap-4 py-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition-colors duration-300 ${
                            storyStep >= i
                              ? 'bg-[#FF8000] text-white shadow-md shadow-[#FF8000]/25'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          <Icon size={18} />
                        </div>
                        <div className="min-w-0 flex-1 pt-1.5">
                          <p className="text-base font-semibold text-[#0F172A] sm:text-lg">{step.title}</p>
                          {i < STEPS.length - 1 && (
                            <div
                              className={`mt-3 h-8 w-0.5 rounded-full transition-colors duration-500 ${
                                storyStep > i ? 'bg-[#FF8000]/30' : 'bg-slate-200'
                              }`}
                            />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* MOCKUP */}
            <Reveal delay={0.1}>
              <div className="sticky top-24 flex items-start justify-center lg:justify-end">
                <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.15)]">
                  <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3">
                    <div className="h-3 w-3 rounded-full bg-red-400" />
                    <div className="h-3 w-3 rounded-full bg-amber-400" />
                    <div className="h-3 w-3 rounded-full bg-green-400" />
                    <span className="ml-3 text-xs font-medium text-slate-400">Cosiris CRM</span>
                  </div>
                  <div className="p-5">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="h-4 w-32 rounded bg-slate-100" />
                      <div className="h-6 w-20 rounded-full bg-[#FF8000]/10" />
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: 'Carlos Mendoza', status: 'Nuevo', price: '425.000 €' },
                        { name: 'María García', status: 'En seguimiento', price: '312.000 €' },
                        { name: 'Ana López', status: 'Visita programada', price: '538.000 €' },
                        { name: 'Pedro Sánchez', status: 'Oferta recibida', price: '275.000 €' },
                      ].map((lead, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 p-3.5"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF8000]/10 text-xs font-bold text-[#FF8000]">
                              {lead.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0F172A]">{lead.name}</p>
                              <p className="text-xs text-slate-400">{lead.price}</p>
                            </div>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                              i === 0
                                ? 'bg-green-100 text-green-700'
                                : i === 1
                                  ? 'bg-blue-100 text-blue-700'
                                  : i === 2
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {lead.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* CTA — aparece tras la historia */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={storyComplete ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.5, ease: EASE }}
            className="mt-10 text-center"
          >
            <button
              type="button"
              onClick={() => navigateTo('/inmobiliarias/registro')}
              className="group inline-flex items-center gap-2.5 rounded-full bg-[#FF8000] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF8000]/25 transition-all duration-200 hover:bg-[#E67300] hover:shadow-xl hover:shadow-[#FF8000]/30 active:scale-95"
            >
              Empieza gratis durante 30 días
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </motion.div>

          {/* BENEFICIOS — fila horizontal */}
          <Reveal delay={0.15}>
            <div className="mx-auto mt-14 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
              {[
                'Directorio Público',
                'CRM',
                'IA',
                'Captación de Leads',
                'Automatizaciones',
                'Sin permanencia',
              ].map((b) => (
                <span key={b} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Check size={14} className="text-[#FF8000]" />
                  {b}
                </span>
              ))}
            </div>
          </Reveal>

          {/* FUNCIONALIDADES — 4 tarjetas de beneficio */}
          <Reveal delay={0.2}>
            <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: UserPlus, title: 'Consigue más propietarios', desc: 'Recibe solicitudes directamente desde tu perfil.' },
                { icon: LayoutDashboard, title: 'Gestiona todos tus clientes', desc: 'Organiza cada oportunidad desde un único lugar.' },
                { icon: Zap, title: 'Automatiza el seguimiento', desc: 'WhatsApp, Email e IA trabajando por ti.' },
                { icon: Megaphone, title: 'Haz crecer tu marca', desc: 'Contenido, campañas y herramientas listas para usar.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div
                  key={title}
                  className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF8000]/20 hover:shadow-md hover:shadow-[#FF8000]/5"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000] transition-all duration-200 group-hover:bg-[#FF8000] group-hover:text-white">
                    <Icon size={20} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

    </div>
  );
}
