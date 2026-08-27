import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Eye, FileText, Clock, Brain, ChevronDown, ChevronUp,
  Megaphone, Mail, CheckCircle2, Zap, Video,

  TrendingUp, PhoneCall, CalendarCheck, Filter, Repeat2, Trophy,
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/lib/seo';

// ─── Constants ────────────────────────────────────────────────────────────────

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

// ─── Dot Grid (shared visual DNA) ────────────────────────────────────────────

function DotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });
  const rafId = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const SPACING = 28, RADIUS = 1.5, EFFECT_RADIUS = 120, MAX_SCALE = 3.5;
    let cols = 0, rows = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      cols = Math.ceil(canvas.width / SPACING) + 1;
      rows = Math.ceil(canvas.height / SPACING) + 1;
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x, my = mouse.current.y;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * SPACING, y = r * SPACING;
          const dx = mx - x, dy = my - y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = dist < EFFECT_RADIUS ? 1 + (MAX_SCALE - 1) * Math.pow(1 - dist / EFFECT_RADIUS, 2) : 1;
          const alpha = dist < EFFECT_RADIUS ? 0.1 + 0.35 * Math.pow(1 - dist / EFFECT_RADIUS, 1.5) : 0.1;
          ctx.beginPath();
          ctx.arc(x, y, RADIUS * scale, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(15,23,42,${alpha})`;
          ctx.fill();
        }
      }
      rafId.current = requestAnimationFrame(draw);
    };

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onLeave = () => { mouse.current = { x: -9999, y: -9999 }; };

    resize();
    draw();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Section divider ─────────────────────────────────────────────────────────

function Divider() {
  return <div className="mx-auto max-w-5xl px-6"><div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" /></div>;
}

// ─── BLOQUE 1 — Redes Sociales ────────────────────────────────────────────────

const SOCIAL_PACKS = [
  {
    name: 'MINI',
    tagline: 'Presencia básica',
    features: ['3 publicaciones estáticas', '1 vídeo editado', 'Diseño base incluido', 'Redacción + hashtags'],
    highlight: false,
    sourceContext: 'social_mini_plan',
  },
  {
    name: 'BÁSICO',
    tagline: 'Impulsa tu marca',
    features: ['4 publicaciones estáticas', '2 vídeos editados', 'Diseño personalizado', 'Redacción + hashtags'],
    highlight: true,
    sourceContext: 'social_basico_plan',
  },
  {
    name: 'PREMIUM',
    tagline: 'Potencia total',
    features: ['6 publicaciones estáticas', '4 vídeos editados', 'Edición a tu estilo', 'Personalización total'],
    highlight: false,
    sourceContext: 'social_premium_plan',
  },
];

const SOCIAL_BENEFITS = [
  { icon: <Eye size={18} />, label: 'Visibilidad constante' },
  { icon: <FileText size={18} />, label: 'Contenido estratégico' },
  { icon: <Video size={18} />, label: 'Vídeos que conectan' },
  { icon: <Clock size={18} />, label: 'Ahorro de tiempo' },
];

function RedesSection() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 md:py-36">
      <FadeUp>
        <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
          Tu nuevo escaparate
        </span>
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tighter text-slate-900 md:text-5xl">
          Redes Sociales
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
          La mejor forma de ganar presencia local y hacer zona a través de una pantalla. Nos encargamos de todo: diseño, textos, planificación y vídeos para que tus redes trabajen por ti cada día.
        </p>
      </FadeUp>

      {/* Benefit chips */}
      <div className="mt-10 flex flex-wrap gap-3">
        {SOCIAL_BENEFITS.map((b, i) => (
          <FadeUp key={b.label} delay={i * 0.08}>
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm">
              <span className="text-[#FF8000]">{b.icon}</span>
              {b.label}
            </span>
          </FadeUp>
        ))}
      </div>

      {/* Pricing cards */}
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        {SOCIAL_PACKS.map((pack, i) => (
          <FadeUp key={pack.name} delay={i * 0.1}>
            <div
              className={`relative flex flex-col rounded-xl border p-8 transition-shadow hover:shadow-lg ${
                pack.highlight
                  ? 'border-[#FF8000] bg-white shadow-[0_0_0_1px_#FF8000]'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              {pack.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#FF8000] px-3 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white">
                  Más popular
                </span>
              )}
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{pack.tagline}</p>
              <p className="mt-2 text-3xl font-black tracking-tighter text-slate-900">
                {pack.name}
              </p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#FF8000]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openContactModal({ initialServices: ['Gestión Redes'], sourceContext: pack.sourceContext })}
                className={`mt-8 w-full rounded-md py-3 text-[0.75rem] font-bold uppercase tracking-[0.14em] transition-colors ${
                  pack.highlight
                    ? 'bg-[#FF8000] text-white hover:bg-[#E67300]'
                    : 'border border-slate-200 bg-white text-slate-800 hover:border-[#FF8000] hover:text-[#FF8000]'
                }`}
              >
                Empezar
              </button>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── BLOQUE 2 — Ads + IA ──────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { icon: <Megaphone size={18} />, title: 'Impacto', desc: 'El propietario ve el anuncio con intención real.' },
  { icon: <FileText size={18} />, title: 'Interés', desc: 'Rellena el formulario de captación.' },
  { icon: <Brain size={18} />, title: 'Cualificación', desc: 'Nuestro agente de IA llama en 10 min para filtrar.' },
  { icon: <Filter size={18} />, title: 'Lead Real', desc: 'Recibes el contacto listo para avanzar.' },
  { icon: <Repeat2 size={18} />, title: 'Seguimiento', desc: 'Automatización para no perder el contacto.' },
  { icon: <Trophy size={18} />, title: 'Éxito', desc: 'Consigues la visita de captación.' },
];

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

function AdsSection() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 md:py-36">
      <FadeUp>
        <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
          Invertir en campañas es invertir en captación
        </span>
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tighter text-slate-900 md:text-5xl">
          Campaña de Captación de Leads
        </h2>
      </FadeUp>

      {/* Timeline */}
      <div className="mt-16 grid grid-cols-1 gap-0 md:grid-cols-6">
        {TIMELINE_STEPS.map((step, i) => (
          <FadeUp key={step.title} delay={i * 0.09} className="relative flex flex-col items-center text-center">
            {/* Connector line */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div className="absolute top-5 left-1/2 hidden h-px w-full bg-gradient-to-r from-[#FF8000]/60 to-slate-200 md:block" />
            )}
            <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 border-[#FF8000] bg-white text-[#FF8000] shadow-sm">
              {step.icon}
            </div>
            {/* Mobile connector */}
            {i < TIMELINE_STEPS.length - 1 && (
              <div className="my-1 h-6 w-px bg-gradient-to-b from-[#FF8000]/60 to-slate-200 md:hidden" />
            )}
            <p className="mt-3 text-xs font-bold uppercase tracking-wider text-slate-900">{step.title}</p>
            <p className="mt-1 px-2 text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
          </FadeUp>
        ))}
      </div>

      {/* Social proof */}
      <div className="mt-20">
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
      </div>

      {/* Ads CTA */}
      <FadeUp>
        <div className="mt-14 flex justify-center">
          <button
            onClick={() => openContactModal({ initialServices: ['Captación Ads'], sourceContext: 'ads_conversion_section' })}
            className="group inline-flex items-center gap-2 rounded-md bg-[#FF8000] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#E67300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000]"
          >
            Solicitar más información sobre captación
          </button>
        </div>
      </FadeUp>
    </section>
  );
}

// ─── BLOQUE 3 — Email Marketing ────────────────────────────────────────────────

const EMAIL_PACKS = [
  {
    name: 'PACK PRO',
    tagline: 'Gestión completa',
    features: [
      'Estrategia de email a medida',
      'Redacción profesional',
      'Diseño de plantillas atractivo',
      'Flujo automatizado incluido',
    ],
    highlight: true,
    icon: <Zap size={20} />,
    sourceContext: 'email_pro_plan',
  },
];

function EmailSection() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto max-w-5xl px-6 py-28 md:py-36">
      <FadeUp>
        <span className="mb-4 inline-block text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">
          Campañas de captación de leads · Estrategia, no Spam
        </span>
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tighter text-slate-900 md:text-5xl">
          Email Marketing
        </h2>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
          Automatizamos el seguimiento de tus leads para que no pierdas oportunidades por falta de contacto.
          Tu marca comunica mientras tus correos trabajan por ti.
        </p>
      </FadeUp>

      {/* Feature row */}
      <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4">
        {[
          { icon: <PhoneCall size={16} />, label: 'Seguimiento automático' },
          { icon: <TrendingUp size={16} />, label: 'Más conversiones' },
          { icon: <CalendarCheck size={16} />, label: 'Secuencias programadas' },
          { icon: <Mail size={16} />, label: 'Sin esfuerzo manual' },
        ].map((item, i) => (
          <FadeUp key={item.label} delay={i * 0.08}>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-5 text-center">
              <span className="text-[#FF8000]">{item.icon}</span>
              <span className="text-xs font-semibold text-slate-700">{item.label}</span>
            </div>
          </FadeUp>
        ))}
      </div>

      {/* Pricing */}
      <div className="mt-12 max-w-sm mx-auto">
        {EMAIL_PACKS.map((pack, i) => (
          <FadeUp key={pack.name} delay={i * 0.12}>
            <div
              className={`relative flex flex-col rounded-xl border p-8 transition-shadow hover:shadow-lg ${
                pack.highlight
                  ? 'border-[#FF8000] bg-white shadow-[0_0_0_1px_#FF8000]'
                  : 'border-slate-200 bg-white shadow-sm'
              }`}
            >
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${pack.highlight ? 'bg-[#FF8000]/10 text-[#FF8000]' : 'bg-slate-100 text-slate-500'}`}>
                {pack.icon}
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{pack.tagline}</p>
              <p className="mt-1 text-3xl font-black tracking-tighter text-slate-900">{pack.name}</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {pack.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[#FF8000]" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => openContactModal({ initialServices: ['Email Marketing'], sourceContext: pack.sourceContext })}
                className={`mt-8 w-full rounded-md py-3 text-[0.75rem] font-bold uppercase tracking-[0.14em] transition-colors ${
                  pack.highlight
                    ? 'bg-[#FF8000] text-white hover:bg-[#E67300]'
                    : 'border border-slate-200 bg-white text-slate-800 hover:border-[#FF8000] hover:text-[#FF8000]'
                }`}
              >
                Empezar
              </button>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── BLOQUE 4 — FAQ ────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: '¿Y si no tengo fotos buenas?',
    a: 'No es un problema. Mejoramos las imágenes que tengas o creamos una base visual personalizada para tu marca. Siempre encontramos una solución.',
  },
  {
    q: '¿Tengo que estar pendiente cada semana?',
    a: 'Para nada. Nos encargamos de todo: planificamos, diseñamos y publicamos. Tú validas una vez al mes si quieres o simplemente confías en nosotros.',
  },
  {
    q: '¿Puedo controlar cuánto invierto en campañas?',
    a: 'Sí, siempre. Definimos juntos el presupuesto publicitario y lo optimizamos para conseguir el mayor número de leads al menor coste posible.',
  },
  {
    q: '¿Cuánto tarda en verse resultados?',
    a: 'Las campañas de captación suelen generar resultados en las primeras semanas. Las redes sociales son una estrategia de medio plazo que madura en 2-3 meses.',
  },
  {
    q: '¿Puedo combinar varios servicios?',
    a: 'Absolutamente. Muchos clientes combinan redes + campañas para máximo impacto. Te asesoramos sobre qué combinación tiene más sentido para tu realidad.',
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
      <FadeUp>
        <h2 className="mb-12 text-3xl font-black tracking-tighter text-slate-900 md:text-4xl">
          Preguntas frecuentes
        </h2>
      </FadeUp>
      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <FadeUp key={faq.q} delay={i * 0.06}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-slate-50"
                aria-expanded={open === i}
              >
                <span className="pr-4 text-sm font-semibold text-slate-900">{faq.q}</span>
                <span className="shrink-0 text-slate-400">
                  {open === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </span>
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: 0.3, ease: EXPO }}
                className="overflow-hidden"
              >
                <p className="px-6 pb-5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </motion.div>
            </div>
          </FadeUp>
        ))}
      </div>
    </section>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function ServiciosPage() {
  useSEO({
    path: '/servicios',
    title: 'Servicios de marketing inmobiliario | Cosiris',
    description: 'Captación y digitalización automatizada para inmobiliarias: gestión de redes, ads, email marketing y agente IA. Descubre cómo funciona el sistema de Cosiris.',
  });

  const { openContactModal } = useUI();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar />

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-24 md:py-32">
        <DotGrid />
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
              Nuestros servicios
            </span>
          </motion.div>
          <motion.h1
            className="mt-4 text-4xl font-black leading-tight tracking-tighter text-slate-900 md:text-6xl"
            initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: EXPO, delay: 0.1 }}
          >
            Estrategia, Sistema
            <br className="hidden md:block" />
            <span className="text-[#FF8000]"> y Resultados.</span>
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600"
            initial={{ opacity: 0, y: 20, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.65, ease: EXPO, delay: 0.2 }}
          >
            Tres pilares diseñados para que tu inmobiliaria deje de buscar oportunidades
            y empiece a generarlas.
          </motion.p>

          {/* Jump nav */}
          <motion.div
            className="mt-10 flex flex-wrap justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: EXPO, delay: 0.32 }}
          >
            {[
              { label: 'Redes Sociales', href: '#redes' },
              { label: 'Captación Ads + IA', href: '#ads' },
              { label: 'Email Marketing', href: '#email' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-[#FF8000] hover:text-[#FF8000]"
              >
                {item.label}
              </a>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <div id="redes"><RedesSection /></div>
      <Divider />
      <div id="ads"><AdsSection /></div>
      <Divider />
      <div id="email"><EmailSection /></div>
      <Divider />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="mx-6 mb-20 overflow-hidden rounded-2xl bg-[#FF8000] md:mx-12">
        <FadeUp>
          <div className="relative px-10 py-16 text-center md:py-20">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-12 h-80 w-80 rounded-full bg-white/8" />
            <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/70">
              Siguiente paso
            </p>
            <h2 className="relative text-3xl font-black tracking-tighter text-white md:text-4xl">
              ¿Listo para llevar tu inmobiliaria al siguiente nivel?
            </h2>
            <p className="relative mt-4 text-base leading-relaxed text-white/80">
              Cuéntanos tu caso y estudiamos qué combinación de servicios se adapta mejor a ti.
            </p>
            <button
              onClick={() => openContactModal({ sourceContext: 'servicios_cta' })}
              className="relative mt-8 inline-flex items-center gap-2 rounded-md bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#FF8000] shadow-md transition-all duration-300 hover:bg-slate-50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Solicitar consulta gratuita
            </button>
          </div>
        </FadeUp>
      </section>

      <Footer />
    </div>
  );
}
