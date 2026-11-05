import { useRef, useState } from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Database,
  Heart,
  Mail,
  MessageCircle,
  MessageSquare,
  Send,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { SwipeRow } from '@/components/ui/swipe-row';

// "Del anuncio a la captación": storytelling ligado al scroll. El panel se
// queda fijo mientras la sección avanza, sin retener el scroll: la altura de la
// sección marca el recorrido, y se puede ir arriba, abajo o saltar a un paso.
// Cada maqueta se monta pieza a pieza al aparecer (variantes de framer-motion
// con stagger). Son ejemplos de la interfaz: no llevan cifras ni resultados.

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];
const ORANGE = '#FF8000';

const stage = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};
const piece = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EXPO } },
};
const pop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, duration: 0.5, bounce: 0.3 } },
};
const rise = {
  hidden: { opacity: 0, scaleY: 0 },
  show: { opacity: 1, scaleY: 1, transition: { duration: 0.5, ease: EXPO } },
};
const drop = {
  hidden: { opacity: 0, y: -26 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, duration: 0.6, bounce: 0.25 } },
};
const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 0.6, ease: 'easeInOut' as const } },
};

// live: la maqueta se monta nada más aparecer (escritorio, al cambiar de paso).
// Sin live espera a entrar en pantalla (móvil, donde van en fila deslizable).
function Stage({ live, children }: { live: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      variants={stage}
      initial="hidden"
      {...(live ? { animate: 'show' } : { whileInView: 'show', viewport: { once: true, margin: '-60px' } })}
      className="relative mx-auto aspect-square w-full max-w-[min(27.5rem,62svh)]"
      aria-hidden="true"
    >
      <motion.span variants={pop} className="absolute inset-[12%] rounded-full bg-[#FF8000]/10" />
      {children}
    </motion.div>
  );
}

const box = { transformBox: 'fill-box', transformOrigin: '50% 100%' } as React.CSSProperties;

// Casa que se construye: suelo, paredes, tejado, ventanas y árbol.
function HouseBuild({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 240 200" className={className} fill="none">
      <motion.path variants={draw} d="M14 186h212" stroke={ORANGE} strokeWidth="3" strokeLinecap="round" />
      <motion.rect variants={rise} style={box} x="52" y="86" width="136" height="100" rx="6" fill="#FFFFFF" stroke="#F5D9BC" strokeWidth="2" />
      <motion.rect variants={drop} x="144" y="44" width="20" height="36" rx="3" fill="#F3DCC4" />
      <motion.path variants={drop} d="M34 96 120 30l86 66a8 8 0 0 1-10 12l-76-56-76 56a8 8 0 0 1-10-12Z" fill={ORANGE} />
      <motion.rect variants={rise} style={box} x="74" y="126" width="34" height="60" rx="4" fill="#E67300" />
      <motion.rect variants={pop} x="124" y="118" width="46" height="36" rx="4" fill="#FFB866" />
      <motion.path variants={draw} d="M147 118v36M124 136h46" stroke="#FBEEDF" strokeWidth="3" />
      <motion.g variants={pop}>
        <rect x="205" y="160" width="5" height="26" fill="#A85A12" />
        <ellipse cx="207" cy="146" rx="15" ry="22" fill="#E67300" />
      </motion.g>
    </svg>
  );
}

function PhoneAd({ live }: { live: boolean }) {
  return (
    <Stage live={live}>
      <motion.div variants={piece} className="absolute top-[3%] left-[14%] flex h-[92%] w-[58%] rotate-[5deg] flex-col rounded-[2rem] border-4 border-neutral-700 bg-white p-3 text-black">
        <motion.div variants={piece} className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-[#FF8000] text-[10px] font-extrabold text-white">TI</span>
          <span>
            <span className="block text-xs font-bold">Tu Inmobiliaria</span>
            <span className="block text-[10px] text-neutral-500">Publicidad</span>
          </span>
        </motion.div>
        <motion.p variants={piece} className="mt-2 text-xs font-bold">
          ¿Quieres vender tu vivienda?
        </motion.p>
        <motion.div variants={piece} className="mt-2 flex flex-1 items-end justify-center overflow-hidden rounded-lg bg-[#FFDDB8] pt-2">
          <HouseBuild className="w-[92%]" />
        </motion.div>
        <motion.span variants={pop} className="mt-2 rounded-lg bg-[#FF8000] py-1.5 text-center text-[11px] font-bold">
          Más información
        </motion.span>
        <motion.div variants={piece} className="mt-2 flex gap-3 text-neutral-500">
          <Heart size={15} />
          <MessageSquare size={15} />
          <Send size={15} />
        </motion.div>
      </motion.div>
    </Stage>
  );
}

function LandingForm({ live }: { live: boolean }) {
  return (
    <Stage live={live}>
      <motion.div variants={piece} className="absolute inset-x-[4%] top-[10%] overflow-hidden rounded-2xl border border-white/10 bg-white text-black">
        <div className="flex gap-1.5 bg-neutral-100 px-3 py-2">
          <span className="size-2 rounded-full bg-neutral-300" />
          <span className="size-2 rounded-full bg-neutral-300" />
          <span className="size-2 rounded-full bg-neutral-300" />
        </div>
        <div className="grid grid-cols-[1fr_38%] gap-3 p-5">
          <div className="flex flex-col gap-2.5">
            <motion.p variants={piece} className="text-lg font-extrabold leading-tight">
              ¿Cuánto vale tu vivienda?
            </motion.p>
            {['Dirección', 'Teléfono', 'Correo'].map((label) => (
              <motion.span key={label} variants={piece} className="rounded-lg border border-neutral-200 px-3 py-2 text-xs text-neutral-500">
                {label}
              </motion.span>
            ))}
            <motion.span variants={pop} className="rounded-lg bg-[#FF8000] py-2 text-center text-xs font-bold">
              Quiero más información
            </motion.span>
          </div>
          <div className="flex items-end">
            <HouseBuild className="w-full" />
          </div>
        </div>
      </motion.div>
    </Stage>
  );
}

function QualifyCard({ live }: { live: boolean }) {
  const rows = [
    ['Intención', 'Quiere vender'],
    ['Inmueble', 'Piso'],
    ['Zona', 'Tu zona'],
    ['Plazo', 'Este año'],
  ];
  return (
    <Stage live={live}>
      <motion.div variants={piece} className="absolute inset-x-[8%] top-[12%] rounded-2xl border border-white/10 bg-neutral-900 p-5 text-white">
        <motion.div variants={piece} className="flex items-center justify-between">
          <span className="text-base font-bold">Propietario</span>
          <span className="rounded-full border border-white/20 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-300">Ejemplo</span>
        </motion.div>
        <ul className="mt-3 divide-y divide-white/10">
          {rows.map(([label, value]) => (
            <motion.li key={label} variants={piece} className="flex items-center justify-between gap-4 py-2.5 text-sm">
              <span className="text-neutral-400">{label}</span>
              <span className="flex items-center gap-2 font-semibold">
                {value}
                <motion.span variants={pop} className="flex size-5 items-center justify-center rounded-full bg-[#FF8000] text-white">
                  <Check size={12} strokeWidth={3} />
                </motion.span>
              </span>
            </motion.li>
          ))}
        </ul>
        <motion.div variants={pop} className="mt-3 rounded-lg bg-[#FF8000] py-2 text-center text-sm font-bold text-white">
          Propietario cualificado
        </motion.div>
      </motion.div>
    </Stage>
  );
}

function Pipeline({ live }: { live: boolean }) {
  const columns = ['Nuevo', 'Contactado', 'Visita'];
  return (
    <Stage live={live}>
      <motion.div variants={piece} className="absolute inset-x-0 top-[14%] grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-neutral-900 p-3 text-white">
        {columns.map((c, i) => (
          <motion.div key={c} variants={piece} className="flex h-64 flex-col gap-2 rounded-xl bg-white/5 p-2">
            <span className="text-xs font-semibold text-neutral-300">{c}</span>
            {i > 0 && <span className="h-11 rounded-lg bg-white/10" />}
            {i === 2 && <span className="h-11 rounded-lg bg-white/10" />}
            {i === 0 && (
              <motion.div
                variants={{ hidden: { opacity: 0, x: -60, rotate: -4 }, show: { opacity: 1, x: 0, rotate: 0, transition: { type: 'spring', duration: 0.7, bounce: 0.25, delay: 0.5 } } }}
                className="rounded-lg bg-[#FF8000] p-2 text-white"
              >
                <span className="block text-xs font-extrabold">Lead nuevo</span>
                <span className="block text-[10px] font-semibold">Propietario · Quiere vender</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </motion.div>
    </Stage>
  );
}

function FlowNode({ icon: Icon, label, className }: { icon: LucideIcon; label: string; className: string }) {
  return (
    <motion.div variants={pop} className={`absolute flex w-24 flex-col items-center gap-1.5 ${className}`}>
      <span className="flex size-16 items-center justify-center rounded-2xl border border-white/15 bg-neutral-900 text-[#FF8000]">
        <Icon size={26} />
      </span>
      <span className="text-sm font-semibold text-white">{label}</span>
    </motion.div>
  );
}

function FollowUpFlow({ live }: { live: boolean }) {
  return (
    <Stage live={live}>
      <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full" fill="none">
        <motion.path variants={draw} d="M200 110C200 180 90 170 90 240" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 6" />
        <motion.path variants={draw} d="M200 110C200 180 310 170 310 240" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 6" />
        <motion.path variants={draw} d="M125 285h150" stroke={ORANGE} strokeWidth="2.5" strokeDasharray="6 6" />
      </svg>
      <FlowNode icon={Database} label="CRM" className="top-[7%] left-1/2 -translate-x-1/2" />
      <FlowNode icon={Mail} label="Email" className="top-[60%] left-[10%]" />
      <FlowNode icon={MessageCircle} label="WhatsApp" className="top-[60%] right-[10%]" />
    </Stage>
  );
}

function SuccessHouse({ live }: { live: boolean }) {
  return (
    <Stage live={live}>
      <HouseBuild className="absolute inset-x-[4%] bottom-[8%]" />
      <motion.span variants={pop} className="absolute top-[12%] right-[6%] flex items-center gap-2 rounded-full bg-white px-3.5 py-2 text-sm font-bold text-black">
        <span className="flex size-5 items-center justify-center rounded-full bg-[#FF8000]">
          <Check size={12} strokeWidth={3} />
        </span>
        Captación
      </motion.span>
    </Stage>
  );
}

const STEPS = [
  { name: 'Impacto', title: 'El propietario ve tu anuncio.', text: 'El propietario ve el anuncio con intención real de vender.', goal: 'Generar atención', Scene: PhoneAd },
  { name: 'Interés', title: 'Deja sus datos.', text: 'Rellena el formulario de captación en pocos segundos.', goal: 'Conseguir una consulta', Scene: LandingForm },
  { name: 'Cualificación', title: 'La IA le llama en 10 minutos.', text: 'Nuestro agente de IA llama en 10 minutos para filtrar y cualificar.', goal: 'Identificar oportunidades', Scene: QualifyCard },
  { name: 'Lead real', title: 'Recibes un contacto listo.', text: 'Recibes el contacto listo para avanzar, con la información clave.', goal: 'Entregar oportunidades', Scene: Pipeline },
  { name: 'Seguimiento', title: 'Nadie se queda sin respuesta.', text: 'Automatización para no perder el contacto en ningún momento.', goal: 'Mantener el contacto', Scene: FollowUpFlow },
  { name: 'Éxito', title: 'Una nueva oportunidad de negocio.', text: 'Tu equipo puede avanzar hacia la valoración, captación y comercialización del inmueble.', goal: 'Convertir oportunidades en captaciones', Scene: SuccessHouse },
];

const pad = (n: number) => String(n).padStart(2, '0');

function GoalTag({ goal }: { goal: string }) {
  return (
    <span className="inline-flex items-center gap-2.5 rounded-full border border-[#FF8000]/50 py-1.5 pr-4 pl-1.5 text-sm font-semibold text-[#FF8000]">
      <span className="flex size-8 items-center justify-center rounded-full bg-[#FF8000]/15">
        <Target size={16} aria-hidden="true" />
      </span>
      Objetivo: {goal.toLowerCase()}
    </span>
  );
}

function Heading({ id }: { id?: string }) {
  return (
    <h2 id={id} className="text-[2.1rem] font-extrabold leading-[1.1] tracking-[-0.03em] md:text-4xl">
      <span className="whitespace-nowrap">Del anuncio a la</span> <span className="block text-[#FF8000]">captación</span>
    </h2>
  );
}

export function ProcessSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (p) => setActive(Math.min(STEPS.length - 1, Math.floor(p * STEPS.length))));

  const jump = (index: number) => {
    const track = trackRef.current;
    if (!track) return;
    const top = track.getBoundingClientRect().top + window.scrollY;
    const range = track.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + range * ((index + 0.5) / STEPS.length), behavior: 'smooth' });
  };

  const step = STEPS[active];
  const arrow = 'flex size-12 cursor-pointer items-center justify-center rounded-full border transition-colors duration-150 disabled:cursor-default disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]';

  return (
    <section id="como-funciona" aria-labelledby="process-title" className="w-full scroll-mt-16 rounded-[2rem] bg-[#0D0D0D] text-white md:rounded-[3rem]">
      {/* Escritorio: panel fijo mientras la altura de la sección marca el avance. */}
      <div ref={trackRef} className="hidden lg:block lg:h-[420svh]">
        <div className="sticky top-0 flex h-svh items-center overflow-hidden pt-16">
          <div className="mx-auto grid w-full max-w-[87.5rem] grid-cols-[minmax(19.5rem,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] items-center gap-10 px-10 xl:gap-14">
            <div>
              <Heading id="process-title" />
              <ol className="relative mt-9">
                <span aria-hidden="true" className="absolute top-3 bottom-3 left-[11px] w-0.5 bg-white/15" />
                <motion.span
                  aria-hidden="true"
                  className="absolute top-3 bottom-3 left-[11px] w-0.5 origin-top bg-[#FF8000]"
                  style={{ scaleY: scrollYProgress }}
                />
                {STEPS.map((s, i) => {
                  const state = i === active ? 'active' : i < active ? 'done' : 'next';
                  return (
                    <li key={s.name}>
                      <button
                        type="button"
                        onClick={() => jump(i)}
                        aria-current={state === 'active' ? 'step' : undefined}
                        className="group relative flex min-h-12 w-full cursor-pointer items-center gap-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
                      >
                        <span className={`relative z-10 flex size-6 shrink-0 items-center justify-center rounded-full border-2 border-[#0D0D0D] transition-colors duration-200 ${state === 'next' ? 'bg-neutral-600' : 'bg-[#FF8000]'}`}>
                          {state === 'active' && <span className="size-2 rounded-full bg-white" />}
                        </span>
                        <span
                          className={`font-extrabold tracking-[-0.02em] transition-[color,font-size] duration-200 ${
                            state === 'active' ? 'text-xl text-[#FF8000] xl:text-2xl' : state === 'done' ? 'text-lg text-neutral-300' : 'text-lg text-neutral-500 group-hover:text-neutral-300'
                          }`}
                        >
                          {pad(i + 1)}. {s.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="min-h-[24rem]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={active} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3, ease: EXPO }}>
                  <span className="inline-block rounded-full border border-white/25 px-3.5 py-1 text-xs font-bold tracking-[0.08em]">
                    PASO {pad(active + 1)} DE {pad(STEPS.length)}
                  </span>
                  <p className="mt-5 text-lg font-bold text-[#FF8000]">{step.name}</p>
                  <h3 className="mt-1 text-3xl font-extrabold leading-[1.12] tracking-[-0.02em] xl:text-4xl">{step.title}</h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-300">{step.text}</p>
                  <div className="mt-6">
                    <GoalTag goal={step.goal} />
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex items-center gap-3">
                <button type="button" onClick={() => jump(active - 1)} disabled={active === 0} aria-label="Paso anterior" className={`${arrow} border-white/25 text-white`}>
                  <ArrowLeft size={18} />
                </button>
                <button type="button" onClick={() => jump(active + 1)} disabled={active === STEPS.length - 1} aria-label="Paso siguiente" className={`${arrow} border-[#FF8000] text-[#FF8000]`}>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={active} exit={{ opacity: 0, transition: { duration: 0.15 } }}>
                <step.Scene live />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Móvil: secuencia vertical; cada maqueta se monta al entrar en pantalla. */}
      <div className="px-5 py-12 md:py-20 lg:hidden">
        <Heading />
        <SwipeRow dark label="Pasos del sistema" className="-mx-5 mt-6 scroll-pl-5 px-5 md:mt-10">
          {STEPS.map((s, i) => (
            <li key={s.name} className="rounded-2xl border border-white/15 p-4">
              <span className="inline-block rounded-full border border-white/25 px-3 py-1 text-xs font-bold tracking-[0.08em]">
                PASO {pad(i + 1)} DE {pad(STEPS.length)}
              </span>
              <p className="mt-3 text-base font-bold text-[#FF8000]">{s.name}</p>
              <h3 className="mt-1 text-xl font-extrabold leading-tight tracking-[-0.02em]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-neutral-300">{s.text}</p>
              {/* Las maquetas se diseñaron a 20rem: se reducen enteras, sin recolocar piezas. */}
              <div className="relative mx-auto mt-3 size-56 overflow-hidden">
                <div className="absolute top-0 left-0 w-80 origin-top-left scale-[0.7]">
                  <s.Scene live={false} />
                </div>
              </div>
              <div className="mt-3">
                <GoalTag goal={s.goal} />
              </div>
            </li>
          ))}
        </SwipeRow>
      </div>

    </section>
  );
}
