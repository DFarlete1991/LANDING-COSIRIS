import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight, BarChart3, Bell, Database, Eye, FileText, Clock, Brain, ChevronDown,
  Megaphone, Mail, MessageCircle, CheckCircle2, Target, Users, Video,
  TrendingUp, PhoneCall, CalendarCheck, Filter, Repeat2, Trophy,
} from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { useSEO } from '@/lib/seo';
import { useFluidPage } from '@/lib/use-fluid-page';
import { navigateTo } from '@/lib/utils';
import { VideoGrid } from '@/components/ui/video-grid';
import { SwipeRow } from '@/components/ui/swipe-row';
import { FAQS } from '@/data/faqs';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

const EYEBROW = 'text-[13px] font-bold text-[#C2410C]';
const TITLE = 'text-3xl font-extrabold leading-[1.1] tracking-tight text-black md:text-[2.75rem]';
const BODY = 'text-base leading-relaxed text-neutral-600';
const BUTTON_MOTION = 'cursor-pointer transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97]';
const PRIMARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#FF8000] px-6 text-sm font-bold text-white hover:bg-[#E67300] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 ${BUTTON_MOTION}`;
const SECONDARY = `inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-neutral-300 bg-white px-6 text-sm font-bold text-black hover:border-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2 ${BUTTON_MOTION}`;

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

// ─── Índice de servicios ─────────────────────────────────────────────────────

const SERVICES = [
  { id: 'ads', icon: <Megaphone size={20} />, title: 'Captación Ads + IA', desc: 'Campañas que traen propietarios, filtrados por nuestro agente de IA.' },
  { id: 'redes', icon: <Video size={20} />, title: 'Redes Sociales', desc: 'Diseño, textos, planificación y vídeos para hacer zona.' },
  { id: 'email', icon: <Mail size={20} />, title: 'Email Marketing', desc: 'Seguimiento automático para no perder ningún lead.' },
  { id: 'crm', icon: <Database size={20} />, title: 'Automatizaciones IA y CRM', desc: 'Todos tus contactos ordenados, con avisos y tareas.' },
];

const SECTIONS = [
  { id: 'ads', label: 'Captación' },
  { id: 'redes', label: 'Redes' },
  { id: 'email', label: 'Email' },
  { id: 'crm', label: 'CRM' },
  { id: 'testimonios', label: 'Testimonios' },
];

// Barra que acompaña el scroll: dice en qué servicio estás y salta a otro sin
// tener que recorrer la página.
function SectionNav() {
  const [active, setActive] = useState<string>(SECTIONS[0].id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((e) => e.isIntersecting);
        if (visible) setActive(visible.target.id);
        // Por encima de la primera sección no hay ninguna a la vista.
        else if (entries.some((e) => e.target.id === SECTIONS[0].id && e.boundingClientRect.top > 0)) setActive(SECTIONS[0].id);
      },
      { rootMargin: '-35% 0px -60% 0px' },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Secciones de servicios" className="sticky top-14 z-20 border-b border-neutral-200 bg-white/95 backdrop-blur md:top-[5.75rem] md:mx-auto md:w-fit md:rounded-full md:border md:p-1 md:shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
      <ul className="flex justify-between gap-0 overflow-x-auto px-1 py-1.5 [scrollbar-width:none] sm:gap-1 sm:px-2 md:p-0 [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((s) => (
          <li key={s.id}>
            <a
              href={`#${s.id}`}
              aria-current={active === s.id ? 'true' : undefined}
              className={`inline-flex min-h-10 items-center rounded-full px-1.5 text-xs font-semibold min-[390px]:px-2.5 min-[390px]:text-[13px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] md:px-5 md:text-sm ${
                active === s.id ? 'bg-[#FF8000] text-white' : 'text-neutral-700 hover:text-black'
              }`}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CalculatorLink({ children, className }: { children: React.ReactNode; className: string }) {
  return (
    <a
      href="/calculadora-roi"
      onClick={(e) => {
        e.preventDefault();
        navigateTo('/calculadora-roi');
      }}
      className={className}
    >
      {children}
    </a>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function Hero() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto grid max-w-[87.5rem] items-center gap-6 px-5 pt-6 pb-6 md:px-10 md:pt-20 md:pb-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-20">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, ease: EXPO }}>
        <p className={EYEBROW}>Nuestros servicios</p>
        <h1 className="mt-2 text-4xl font-extrabold leading-[1.06] tracking-tight text-black md:text-6xl">
          Estrategia, Sistema <span className="block text-[#E67300]">y Resultados.</span>
        </h1>
        <p className={`mt-4 max-w-xl ${BODY} md:text-lg`}>
          Cuatro pilares diseñados para que tu inmobiliaria deje de buscar oportunidades y empiece a generarlas.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 md:mt-7">
          <button type="button" onClick={() => openContactModal({ sourceContext: 'servicios_hero' })} className={PRIMARY}>
            Solicita tu diagnóstico
            <ArrowRight size={16} aria-hidden="true" />
          </button>
          <CalculatorLink className={`hidden sm:inline-flex ${SECONDARY}`}>Calcula tu plan</CalculatorLink>
        </div>
      </motion.div>

      <motion.ul
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EXPO, delay: 0.1 }}
        className="divide-y divide-neutral-200 overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_12px_36px_rgba(0,0,0,0.07)]"
      >
        {SERVICES.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="group flex items-center gap-3 p-3 transition-colors duration-150 hover:bg-[#FFF8F1] focus-visible:bg-[#FFF8F1] focus-visible:outline-none md:gap-4 md:p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FFF0E5] text-[#E67300] md:size-12">{s.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-black md:text-base">{s.title}</span>
                <span className="block text-[13px] leading-snug text-neutral-600 md:text-sm">{s.desc}</span>
              </span>
              <ArrowRight size={18} aria-hidden="true" className="shrink-0 text-[#E67300] transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </li>
        ))}
      </motion.ul>
    </section>
  );
}

// ─── Captación ───────────────────────────────────────────────────────────────

const TIMELINE_STEPS = [
  { icon: <Megaphone size={18} />, title: 'Impacto', desc: 'El propietario ve el anuncio con intención real.' },
  { icon: <FileText size={18} />, title: 'Interés', desc: 'Rellena el formulario de captación.' },
  { icon: <Brain size={18} />, title: 'Cualificación', desc: 'Nuestro agente de IA llama en 10 min para filtrar.' },
  { icon: <Filter size={18} />, title: 'Lead Real', desc: 'Recibes el contacto listo para avanzar.' },
  { icon: <Repeat2 size={18} />, title: 'Seguimiento', desc: 'Automatización para no perder el contacto.' },
  { icon: <Trophy size={18} />, title: 'Éxito', desc: 'Consigues la visita de captación.' },
];

// Ilustración plana de la calculadora: pocas formas y solo colores de marca.
const CALC_BUBBLES = [
  { icon: <Users size={18} />, place: '-top-1 left-[46%]', delay: '0s' },
  { icon: <Target size={18} />, place: 'top-[10%] right-[6%]', delay: '-1.3s' },
  { icon: <BarChart3 size={18} />, place: 'top-[46%] left-[3%]', delay: '-2.6s' },
];

function CalculatorIllustration() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-[7.5rem] sm:max-w-[13rem] md:max-w-[17rem]">
      <svg viewBox="0 0 520 380" className="w-full" strokeLinejoin="round" strokeLinecap="round">
        <path d="M72 300C20 216 66 92 186 58c102-29 236-18 288 74 44 78 16 180-74 208-104 32-272 44-328-40Z" fill="#FFF0E5" />
        {/* Casa */}
        <path d="M278 176 372 104l94 72" fill="none" stroke="#0A0A0A" strokeWidth="14" />
        <path d="M296 170v142h152V170l-76-58Z" fill="#FFFFFF" />
        <rect x="324" y="196" width="40" height="44" rx="4" fill="#FFD3A1" />
        <rect x="384" y="196" width="40" height="44" rx="4" fill="#FFD3A1" />
        <rect x="352" y="258" width="44" height="54" rx="4" fill="#0A0A0A" />
        {/* Calculadora */}
        <g transform="rotate(-6 196 200)">
          <rect x="108" y="78" width="176" height="244" rx="26" fill="#0A0A0A" />
          <rect x="128" y="98" width="136" height="72" rx="12" fill="#FFF0E5" />
          <path d="m146 154 28-24 20 14 44-34" fill="none" stroke="#FF8000" strokeWidth="7" />
          <path d="M218 108h22v22" fill="none" stroke="#FF8000" strokeWidth="7" />
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}-${col}`}
                x={128 + col * 48}
                y={186 + row * 42}
                width="40"
                height="32"
                rx="8"
                fill={row === 2 && col === 2 ? '#FF8000' : '#3A3A3A'}
              />
            )),
          )}
        </g>
        <path d="M58 262c10 76 330 66 432-118" fill="none" stroke="#FF8000" strokeWidth="5" />
      </svg>
      {CALC_BUBBLES.map((b) => (
        <span
          key={b.place}
          style={{ animationDelay: b.delay }}
          className={`animate-soft-float absolute hidden size-10 items-center justify-center rounded-full bg-white text-[#E67300] shadow-[0_6px_16px_rgba(0,0,0,0.1)] sm:flex ${b.place}`}
        >
          {b.icon}
        </span>
      ))}
    </div>
  );
}

// Anuncio de la calculadora: ella vive en su propia página.
function CalculatorPromo() {
  return (
    <FadeUp className="mt-3">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-3xl border border-neutral-200 bg-white p-5 md:gap-8 md:px-10 md:py-6 lg:px-12">
        <div>
          <p className="inline-flex items-center gap-1.5 text-[13px] font-bold text-[#C2410C]">
            <BarChart3 size={15} aria-hidden="true" />
            Calculadora ROI
          </p>
          <h3 className="mt-1.5 text-xl font-extrabold leading-tight tracking-tight text-black md:text-3xl">
            Calcula tu plan de captación en <span className="text-[#E67300]">4 pasos</span>
          </h3>
          <p className="mt-2 hidden max-w-lg text-[15px] leading-relaxed text-neutral-600 sm:block">
            Elige tu plan de inversión, y mira los leads, captaciones, ventas y retorno estimados.
          </p>
          <CalculatorLink className={`mt-3 md:mt-4 ${PRIMARY}`}>
            Abrir la calculadora
            <ArrowRight size={16} aria-hidden="true" />
          </CalculatorLink>
        </div>
        <CalculatorIllustration />
      </div>
    </FadeUp>
  );
}

function AdsSection() {
  const { openContactModal } = useUI();
  const cta = (visibility: string) => (
    <button
      type="button"
      onClick={() => openContactModal({ initialServices: ['Captación Ads'], sourceContext: 'ads_conversion_section' })}
      className={`${visibility} ${PRIMARY} focus-visible:ring-white focus-visible:ring-offset-black`}
    >
      Solicitar información
      <ArrowRight size={16} aria-hidden="true" />
    </button>
  );
  return (
    <section className="mx-auto max-w-[87.5rem] px-3 md:px-10">
      <FadeUp>
        <div className="grid gap-6 rounded-3xl bg-[#0A0A0A] p-6 text-white md:p-10 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)] lg:gap-12 lg:p-12">
          <div className="flex flex-col items-start">
            <p className="text-[13px] font-bold text-[#FFB877]">Invertir en campañas es invertir en captación</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-[1.1] tracking-tight md:text-[2.75rem]">
              Campaña de Captación de <span className="text-[#FF8000]">Leads</span>
            </h2>
            {cta('mt-auto hidden lg:inline-flex')}
          </div>

          <ol className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:gap-y-7">
            {TIMELINE_STEPS.map((step) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#FF8000] text-white">{step.icon}</span>
                <div>
                  <h3 className="text-[15px] font-bold">{step.title}</h3>
                  <p className="mt-0.5 text-[13px] leading-snug text-neutral-300 md:text-sm">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          {cta('w-full lg:hidden')}
        </div>
      </FadeUp>

      <CalculatorPromo />
    </section>
  );
}

// ─── Redes Sociales ──────────────────────────────────────────────────────────

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
    features: ['4 publicaciones estáticas', '4 vídeos editados', 'Edición a tu estilo', 'Personalización total'],
    highlight: false,
    sourceContext: 'social_premium_plan',
  },
];

const SOCIAL_BENEFITS = [
  { icon: <Eye size={16} />, label: 'Visibilidad constante' },
  { icon: <FileText size={16} />, label: 'Contenido estratégico' },
  { icon: <Video size={16} />, label: 'Vídeos que conectan' },
  { icon: <Clock size={16} />, label: 'Ahorro de tiempo' },
];

function BenefitGrid({ items }: { items: { icon: React.ReactNode; label: string }[] }) {
  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 md:mt-5">
      {items.map((b) => (
        <li key={b.label} className="flex items-center gap-2 text-[13px] font-semibold leading-tight text-black md:text-sm">
          <span className="shrink-0 text-[#E67300]">{b.icon}</span>
          {b.label}
        </li>
      ))}
    </ul>
  );
}

function PackFeatures({ features }: { features: string[] }) {
  return (
    <ul className="mt-4 flex-1 space-y-2">
      {features.map((f) => (
        <li key={f} className="flex items-start gap-2 text-sm text-neutral-700">
          <CheckCircle2 size={15} aria-hidden="true" className="mt-0.5 shrink-0 text-[#E67300]" />
          {f}
        </li>
      ))}
    </ul>
  );
}

function RedesSection() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto grid max-w-[87.5rem] grid-cols-[minmax(0,1fr)] gap-5 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
      <FadeUp>
        <p className={EYEBROW}>Tu nuevo escaparate</p>
        <h2 className={`mt-2 ${TITLE}`}>Redes Sociales</h2>
        <p className={`mt-3 ${BODY}`}>
          La mejor forma de ganar presencia local y hacer zona a través de una pantalla. Nos encargamos de todo: diseño, textos, planificación y vídeos para que tus redes trabajen por ti cada día.
        </p>
        <BenefitGrid items={SOCIAL_BENEFITS} />
      </FadeUp>

      <div className="min-w-0">
        <SwipeRow
          label="Paquetes de redes sociales"
          arrowsClassName="md:hidden"
          className="-mx-5 scroll-pl-5 px-5 pt-3 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:[&>li]:w-auto md:[&>li]:max-w-none"
        >
          {SOCIAL_PACKS.map((pack, i) => (
            <li key={pack.name}>
              <FadeUp delay={i * 0.06} className="h-full">
                <div className={`relative flex h-full flex-col rounded-2xl border p-5 ${pack.highlight ? 'border-[#FF8000] bg-[#FFF8F1] ring-1 ring-[#FF8000]' : 'border-neutral-200 bg-white'}`}>
                  {pack.highlight && (
                    <span className="absolute -top-3 left-5 rounded-full bg-[#FF8000] px-3 py-0.5 text-[11px] font-bold text-white">Más popular</span>
                  )}
                  <p className="text-2xl font-extrabold tracking-tight text-black">{pack.name}</p>
                  <p className="text-[13px] font-medium text-neutral-600">{pack.tagline}</p>
                  <PackFeatures features={pack.features} />
                  <button
                    type="button"
                    onClick={() => openContactModal({ initialServices: ['Gestión Redes'], sourceContext: pack.sourceContext })}
                    className={`mt-5 w-full ${pack.highlight ? PRIMARY : SECONDARY}`}
                  >
                    Empezar
                  </button>
                </div>
              </FadeUp>
            </li>
          ))}
        </SwipeRow>
      </div>
    </section>
  );
}

// ─── Email Marketing ─────────────────────────────────────────────────────────

const EMAIL_BENEFITS = [
  { icon: <PhoneCall size={16} />, label: 'Seguimiento automático' },
  { icon: <TrendingUp size={16} />, label: 'Más conversiones' },
  { icon: <CalendarCheck size={16} />, label: 'Secuencias programadas' },
  { icon: <Mail size={16} />, label: 'Sin esfuerzo manual' },
];

const EMAIL_FEATURES = [
  'Estrategia de email a medida',
  'Redacción profesional',
  'Diseño de plantillas atractivo',
  'Flujo automatizado incluido',
];

function EmailSection() {
  const { openContactModal } = useUI();
  return (
    <section className="bg-[#FFF8F1]">
      <div className="mx-auto grid max-w-[87.5rem] items-center gap-5 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
        <FadeUp>
          <p className={EYEBROW}>Campañas de captación de leads · Estrategia, no spam</p>
          <h2 className={`mt-2 ${TITLE}`}>Email Marketing</h2>
          <p className={`mt-3 max-w-xl ${BODY}`}>
            Automatizamos el seguimiento de tus leads para que no pierdas oportunidades por falta de contacto. Tu marca comunica mientras tus correos trabajan por ti.
          </p>
          <BenefitGrid items={EMAIL_BENEFITS} />
        </FadeUp>

        <FadeUp delay={0.06}>
          <div className="flex flex-col rounded-2xl bg-white p-5 shadow-[0_12px_36px_rgba(0,0,0,0.07)] md:p-6">
            <p className="text-2xl font-extrabold tracking-tight text-black">PACK PRO</p>
            <p className="text-[13px] font-medium text-neutral-600">Gestión completa</p>
            <PackFeatures features={EMAIL_FEATURES} />
            <button
              type="button"
              onClick={() => openContactModal({ initialServices: ['Email Marketing'], sourceContext: 'email_pro_plan' })}
              className={`mt-5 w-full ${PRIMARY}`}
            >
              Empezar
            </button>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

// ─── Automatizaciones IA y CRM ───────────────────────────────────────────────

const CRM_BENEFITS = [
  { icon: <Database size={16} />, label: 'Contactos ordenados' },
  { icon: <Bell size={16} />, label: 'Avisos y tareas' },
  { icon: <MessageCircle size={16} />, label: 'WhatsApp y email' },
  { icon: <Brain size={16} />, label: 'Agente de IA' },
];

const CRM_COLUMNS = [
  { name: 'Nuevo', cards: 1 },
  { name: 'Contactado', cards: 2 },
  { name: 'Visita', cards: 1 },
];

// Maqueta de ejemplo: no lleva cifras ni datos de clientes.
function CrmBoard() {
  return (
    <div aria-hidden="true" className="rounded-2xl bg-[#0A0A0A] p-3 text-white md:p-4">
      <p className="mb-3 text-[13px] font-semibold text-neutral-300">Ejemplo de tu CRM</p>
      <div className="grid grid-cols-3 gap-2">
        {CRM_COLUMNS.map((c, i) => (
          <div key={c.name} className="flex min-h-36 flex-col gap-2 rounded-xl bg-white/5 p-2 md:min-h-44">
            <span className="text-xs font-semibold text-neutral-300">{c.name}</span>
            {Array.from({ length: c.cards }, (_, n) => (
              <span key={n} className={`rounded-lg p-2 text-[11px] font-bold leading-tight ${i === 0 ? 'bg-[#FF8000] text-white' : 'bg-white/10 text-neutral-300'}`}>
                {i === 0 ? 'Lead nuevo' : i === 1 ? 'Llamar hoy' : 'Visita de captación'}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function CrmSection() {
  const { openContactModal } = useUI();
  return (
    <section className="mx-auto grid max-w-[87.5rem] grid-cols-[minmax(0,1fr)] items-center gap-5 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-12">
      <FadeUp>
        <p className={EYEBROW}>Seguimiento de tus leads por WhatsApp y email</p>
        <h2 className={`mt-2 ${TITLE}`}>Automatizaciones IA y CRM</h2>
        <p className={`mt-3 max-w-xl ${BODY}`}>
          Todos tus contactos ordenados en un CRM, con avisos y tareas para que tu equipo sepa a quién llamar y cuándo.
        </p>
        <BenefitGrid items={CRM_BENEFITS} />
        <button
          type="button"
          onClick={() => openContactModal({ initialServices: ['Agente IA'], sourceContext: 'crm_section' })}
          className={`mt-5 ${PRIMARY}`}
        >
          Solicitar información
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </FadeUp>
      <FadeUp delay={0.06}>
        <CrmBoard />
      </FadeUp>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const reduced = useReducedMotion();
  return (
    <section className="mx-auto grid max-w-[87.5rem] gap-4 px-5 py-10 md:px-10 md:py-16 lg:grid-cols-[minmax(0,4fr)_minmax(0,8fr)] lg:gap-12">
      <FadeUp>
        <h2 className={TITLE}>Preguntas frecuentes</h2>
      </FadeUp>
      <FadeUp>
        <div className="divide-y divide-neutral-200 border-y border-neutral-200">
          {FAQS.map((faq, i) => (
            <div key={faq.q}>
              <button
                type="button"
                onClick={() => setOpen(open === i ? null : i)}
                aria-expanded={open === i}
                className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-4 py-3.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300]"
              >
                <span className="text-[15px] font-semibold text-black">{faq.q}</span>
                <ChevronDown
                  size={18}
                  aria-hidden="true"
                  className={`shrink-0 text-[#E67300] transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                />
              </button>
              <motion.div
                initial={false}
                animate={{ height: open === i ? 'auto' : 0, opacity: open === i ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.25, ease: EXPO }}
                className="overflow-hidden"
              >
                <p className="pb-4 text-sm leading-relaxed text-neutral-600">{faq.a}</p>
              </motion.div>
            </div>
          ))}
        </div>
      </FadeUp>
    </section>
  );
}

// ─── Página ──────────────────────────────────────────────────────────────────

const ANCHOR_OFFSET = 'scroll-mt-28 md:scroll-mt-36';

export function ServiciosPage() {
  useFluidPage();

  // Al llegar con un ancla desde otra página (por ejemplo /servicios#redes) baja
  // hasta esa parte. Con espera: al navegar, la app vuelve arriba justo después.
  useEffect(() => {
    if (!window.location.hash) return;
    const id = window.location.hash.slice(1);
    const timer = setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'instant', block: 'start' }), 200);
    return () => clearTimeout(timer);
  }, []);

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
    <div className="relative min-h-screen bg-white font-sans text-black antialiased">
      <LandingNavbar />
      <Hero />

      <div className="relative">
        <SectionNav />
        <div id="ads" className={`pt-5 md:pt-8 ${ANCHOR_OFFSET}`}><AdsSection /></div>
        <div id="redes" className={ANCHOR_OFFSET}><RedesSection /></div>
        <div id="email" className={ANCHOR_OFFSET}><EmailSection /></div>
        <div id="crm" className={ANCHOR_OFFSET}><CrmSection /></div>
        <div id="testimonios" className={ANCHOR_OFFSET}><VideoGrid /></div>
      </div>

      <FAQ />

      <section className="mx-auto mb-10 max-w-[87.5rem] px-3 md:mb-16 md:px-10">
        <FadeUp>
          <div className="flex flex-col items-start gap-5 rounded-3xl bg-[#FF8000] p-6 md:p-10 lg:flex-row lg:items-center lg:justify-between lg:gap-12 lg:px-12">
            <div>
              <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-white md:text-4xl">
                ¿Listo para llevar tu inmobiliaria al siguiente nivel?
              </h2>
              <p className="mt-2 text-base leading-relaxed text-white">
                Cuéntanos tu caso y estudiamos qué combinación de servicios se adapta mejor a ti.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openContactModal({ sourceContext: 'servicios_cta' })}
              className={`inline-flex min-h-12 w-full shrink-0 items-center justify-center rounded-lg bg-white px-7 text-sm font-bold text-black hover:bg-[#FFF0E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF8000] sm:w-auto ${BUTTON_MOTION}`}
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
