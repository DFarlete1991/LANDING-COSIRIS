import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
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
  Wallet,
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

  const VIDEO_COUNT = 5;
  const shuffledForVideo = useMemo(() => [...agencies].sort(() => Math.random() - 0.5), [agencies]);
  const [videoStartIdx, setVideoStartIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setVideoStartIdx((prev) => (prev + 1) % shuffledForVideo.length), 15000);
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

  const stepsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: stepsProgress } = useScroll({
    target: stepsRef,
    offset: ['start center', 'end center'],
  });
  const markerTop = useTransform(stepsProgress, [0, 1], ['0%', '100%']);
  const [activeStep, setActiveStep] = useState(0);
  useMotionValueEvent(stepsProgress, 'change', (v) => {
    setActiveStep(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length))));
  });

  return (
    <div>
      {/* HERO — video de fondo real, overlay oscuro + buscador */}
      <section className="relative flex min-h-[85vh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-28 text-center text-white sm:min-h-[92vh] sm:pb-28 sm:pt-32">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src="/assets/inmobiliarias/hero-bg.mp4"
            poster="/assets/inmobiliarias/ciudades/madrid.jpg"
            autoPlay muted loop playsInline
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/55 to-black/15" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-2xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 backdrop-blur-md">
            <MapPin size={13} className="text-[#FF8000]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/90">Directorio Cosiris</span>
          </div>
          <h1 className="text-4xl font-black leading-[0.98] tracking-[-0.03em] sm:text-6xl md:text-7xl">
            Encuentra tu
            <br />
            <span className="relative inline-flex text-[#FF8000]">
              inmobiliaria ideal
              <svg
                className="pointer-events-none absolute -bottom-1 left-0 h-3 w-full sm:-bottom-2"
                viewBox="0 0 340 14"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <motion.path
                  d="M4 10.5C90 3 250 3 336 10.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
                />
              </svg>
            </span>
            <br />
            <span className="text-white/70">en tu zona</span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-sm text-white/85 sm:mt-6 sm:text-base md:text-lg">
            Conectamos personas con inmobiliarias reales, cercanas y de confianza en toda España.
          </p>

          <div className="mt-9">
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

      {/* 1. RED DE INMOBILIARIAS + POR QUÉ BUSCAR CON COSIRIS — en columnas, para no repetir el mismo formato centrado dos veces */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-10">
            {/* IZQUIERDA: carrusel de logos */}
            <Reveal>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
                Red de inmobiliarias
              </p>
              <h2 className="mt-3 text-2xl font-black leading-relaxed tracking-[-0.02em] text-[#0F172A] sm:text-3xl">
                Inmobiliarias de toda España<br />
                ya confían en Cosiris para<br />
                encontrar su inmobiliaria ideal<br />
                y vender con confianza
              </h2>
              <div className="mt-8 space-y-4">
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

            {/* DERECHA: por qué buscar con Cosiris — panel gris para diferenciarla del carrusel */}
            <Reveal delay={0.1}>
              <div className="h-full rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
                  Para quien quiere vender
                </p>
                <h2 className="mt-3 text-2xl font-black leading-tight tracking-[-0.02em] text-[#0F172A] sm:text-3xl">
                  La forma más segura de encontrar tu inmobiliaria
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  No eliges a ciegas. Estas son las razones por las que buscar con Cosiris es mejor que buscar por tu cuenta.
                </p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {[
                    {
                      icon: ShieldCheck,
                      title: 'Solo verificadas',
                      desc: 'Cada agencia pasa un proceso de verificación antes de entrar al directorio.',
                    },
                    {
                      icon: Wallet,
                      title: '100% gratis',
                      desc: 'Buscar y contactar con tu inmobiliaria ideal no tiene ningún coste.',
                    },
                    {
                      icon: MapPin,
                      title: 'Cercanía real',
                      desc: 'Profesionales que conocen tu zona — no un call center genérico.',
                    },
                    {
                      icon: Zap,
                      title: 'Respuesta rápida',
                      desc: 'Tu solicitud llega directo a la inmobiliaria que elijas.',
                    },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <Reveal key={title} delay={0.1 + i * 0.06}>
                      <div className="group h-full rounded-xl border border-slate-100 bg-white p-4 shadow-sm shadow-slate-900/5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FF8000]/20 hover:shadow-md hover:shadow-[#FF8000]/5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#FF8000]/10 text-[#FF8000] transition-all duration-200 group-hover:bg-[#FF8000] group-hover:text-white">
                          <Icon size={17} />
                        </div>
                        <p className="mt-3 text-sm font-bold text-slate-900">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                      </div>
                    </Reveal>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
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

          <div
            className="mt-10 flex items-end gap-2 overflow-x-auto overscroll-x-contain px-4 sm:gap-3 md:gap-4 md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {visibleForVideo.map((agency, i) => (
                <motion.button
                  key={`${agency.id}-${videoStartIdx + i}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => navigateTo(`/inmobiliarias/${agency.id}`)}
                  className="group relative w-36 shrink-0 overflow-hidden rounded-2xl shadow-2xl shadow-black/40 transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] sm:w-44 md:w-48 lg:w-52"
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
            ))}
          </div>
        </div>
      </section>

      {/* 3. PARA INMOBILIARIAS — header + confianza */}
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
            <div className="mx-auto mt-16 max-w-3xl rounded-2xl border border-slate-100 bg-slate-50 p-6 sm:mt-20 sm:p-8">
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
        </div>
      </section>

      {/* 3b. STORYTELLING + MOCKUP — banda naranja pálido, pasos como tarjetas independientes con reveal al hacer scroll */}
      <section className="bg-orange-50 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
            <div>
              <Reveal>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000]">
                  Cómo funciona
                </p>
                <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#0F172A] sm:text-2xl">
                  El recorrido del propietario hasta tu inmobiliaria
                </h3>
              </Reveal>

              <Reveal delay={0.1}>
                <div ref={stepsRef} className="relative mt-8">
                  {/* riel del recorrido + marcador que viaja con el scroll real */}
                  <div className="absolute left-9 top-9 bottom-9 -translate-x-1/2">
                    <div className="h-full w-px bg-orange-200" aria-hidden="true" />
                    <motion.div
                      style={{ top: markerTop }}
                      className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2"
                      aria-hidden="true"
                    >
                      <span className="absolute -inset-2 animate-ping rounded-full bg-[#FF8000]/25" />
                      <span className="relative flex h-6 w-6 items-center justify-center rounded-full bg-[#FF8000] shadow-md shadow-[#FF8000]/40 ring-2 ring-white">
                        <MapPin size={12} className="text-white" />
                      </span>
                    </motion.div>
                  </div>

                  <div className="space-y-3">
                    {STEPS.map((step, i) => {
                      const Icon = step.icon;
                      const active = i <= activeStep;
                      const current = i === activeStep;
                      return (
                        <div
                          key={i}
                          className={`relative flex items-center gap-4 rounded-xl border p-4 transition-all duration-300 ${
                            active
                              ? 'border-orange-100 bg-white shadow-sm shadow-orange-900/5'
                              : 'border-orange-100/40 bg-white/40'
                          } ${current ? 'ring-2 ring-[#FF8000]/25' : ''}`}
                        >
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors duration-300 ${
                              active
                                ? 'bg-[#FF8000] text-white shadow-md shadow-[#FF8000]/20'
                                : 'bg-orange-100/60 text-orange-300'
                            }`}
                          >
                            <Icon size={18} />
                          </div>
                          <p
                            className={`text-sm font-semibold leading-snug transition-colors duration-300 sm:text-base ${
                              active ? 'text-[#0F172A]' : 'text-slate-400'
                            }`}
                          >
                            {step.title}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Reveal>
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
                    <div className="relative pl-7">
                      {/* caminito serpenteante — se dibuja en verde según avanza el mismo scroll de los pasos */}
                      <svg
                        className="pointer-events-none absolute bottom-0 left-0 top-0 h-full w-6"
                        viewBox="0 0 24 100"
                        preserveAspectRatio="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 4 C 12 14, 2 14, 2 25 C 2 36, 22 36, 22 50 C 22 64, 2 64, 2 75 C 2 86, 12 86, 12 96"
                          fill="none"
                          stroke="#e2e8f0"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                        />
                        <motion.path
                          d="M12 4 C 12 14, 2 14, 2 25 C 2 36, 22 36, 22 50 C 22 64, 2 64, 2 75 C 2 86, 12 86, 12 96"
                          fill="none"
                          stroke="#22c55e"
                          strokeWidth={2.5}
                          strokeLinecap="round"
                          style={{ pathLength: stepsProgress }}
                        />
                      </svg>

                      <div className="space-y-3">
                        {[
                          { name: 'Carlos Mendoza', status: 'Nuevo', price: '425.000 €' },
                          { name: 'María García', status: 'En seguimiento', price: '312.000 €' },
                          { name: 'Ana López', status: 'Visita programada', price: '538.000 €' },
                          { name: 'Pedro Sánchez', status: 'Oferta recibida', price: '275.000 €' },
                        ].map((lead, i) => {
                          const crmActiveCount = Math.min(4, Math.floor(((activeStep + 1) / STEPS.length) * 4));
                          const reached = i < crmActiveCount;
                          return (
                            <div
                              key={i}
                              className={`flex items-center justify-between rounded-xl border p-3.5 transition-colors duration-300 ${
                                reached ? 'border-green-200 bg-green-50/60' : 'border-slate-100 bg-slate-50/50'
                              }`}
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
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3c. CTA + BENEFICIOS + FUNCIONALIDADES */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-4">
          {/* CTA */}
          <Reveal>
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigateTo('/inmobiliarias/registro')}
                className="group inline-flex items-center gap-2.5 rounded-full bg-[#FF8000] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#FF8000]/25 transition-all duration-200 hover:bg-[#E67300] hover:shadow-xl hover:shadow-[#FF8000]/30 active:scale-95"
              >
                Empieza gratis durante 30 días
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </Reveal>

          {/* BENEFICIOS */}
          <Reveal delay={0.1}>
            <div className="mx-auto mt-16 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-slate-100 pt-10 text-sm text-slate-500 sm:mt-20 sm:pt-12">
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

          {/* FUNCIONALIDADES */}
          <Reveal delay={0.15}>
            <p className="mt-16 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8000] sm:mt-20">
              Funcionalidades
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
