import { useEffect, useRef, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from 'framer-motion';
import { MonitorUp, Pause, Play, ShieldCheck, Users } from 'lucide-react';

// "Antes miraban carteles. Ahora miran pantallas.": la historia del sector como
// una línea de tiempo que avanza sola al verla, sin retener el scroll (justo
// debajo viene otra sección que sí lo hace). Se detiene con el ratón encima, con
// el botón o al pulsar un año, y se queda en 2026: ahí está el mensaje. Cada
// época tiene una escena SVG, que escala sin recolocar piezas en móvil.

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];
const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';
const STEP_MS = 3200;
const ORANGE = '#FF8000';
const INK = '#0A0A0A';
const PEACH = '#FFD3A1';

const stage = (gap: number) => ({
  hidden: {},
  show: { transition: { staggerChildren: gap, delayChildren: 0.06 } },
});
const pop = {
  hidden: { opacity: 0, scale: 0.6 },
  show: { opacity: 1, scale: 1, transition: { type: 'spring' as const, duration: 0.5, bounce: 0.3 } },
};
const piece = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EXPO } },
};
const rise = {
  hidden: { opacity: 0, scaleY: 0 },
  show: { opacity: 1, scaleY: 1, transition: { duration: 0.5, ease: EXPO } },
};
const drop = {
  hidden: { opacity: 0, y: -40, rotate: -8 },
  show: { opacity: 1, y: 0, rotate: 0, transition: { type: 'spring' as const, duration: 0.7, bounce: 0.35 } },
};
const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { duration: 0.7, ease: 'easeInOut' as const } },
};

const center = { transformBox: 'fill-box', transformOrigin: 'center' } as React.CSSProperties;
const base = { transformBox: 'fill-box', transformOrigin: '50% 100%' } as React.CSSProperties;
const top = { transformBox: 'fill-box', transformOrigin: '50% 0%' } as React.CSSProperties;

function Scene({ gap = 0.1, children }: { gap?: number; children: React.ReactNode }) {
  return (
    <motion.svg
      viewBox="0 0 400 300"
      variants={stage(gap)}
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, transition: { duration: 0.18 } }}
      aria-hidden="true"
      className="absolute inset-0 h-full w-full"
      fontFamily="inherit"
    >
      <motion.circle variants={pop} style={center} cx="200" cy="150" r="130" fill={ORANGE} fillOpacity="0.09" />
      {children}
    </motion.svg>
  );
}

function Chip({ x, y, width, label }: { x: number; y: number; width: number; label: string }) {
  return (
    <motion.g variants={pop} style={center}>
      <rect x={x} y={y} width={width} height="32" rx="16" fill="#FFFFFF" stroke={PEACH} strokeWidth="2" />
      <text x={x + width / 2} y={y + 21} textAnchor="middle" fontSize="14" fontWeight="700" fill={INK}>
        {label}
      </text>
    </motion.g>
  );
}

function SellSign({ x = 95, y = 44, scale = 1 }: { x?: number; y?: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect width="210" height="116" rx="12" fill={ORANGE} stroke={INK} strokeWidth="5" />
      <text x="105" y="62" textAnchor="middle" fontSize="38" fontWeight="800" fill="#FFFFFF" letterSpacing="-1">
        SE VENDE
      </text>
      <rect x="45" y="80" width="120" height="10" rx="5" fill="#FFFFFF" fillOpacity="0.75" />
    </g>
  );
}

// 1990: el cartel y lo que rodeaba a la captación de entonces.
function Scene1990() {
  return (
    <Scene>
      <motion.path variants={draw} d="M34 268h332" stroke={PEACH} strokeWidth="4" strokeLinecap="round" fill="none" />
      <motion.rect variants={rise} style={base} x="194" y="140" width="12" height="128" rx="3" fill={INK} />
      <motion.g variants={drop}>
        <motion.g style={top} animate={{ rotate: [-1.6, 1.6, -1.6] }} transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}>
          <SellSign />
        </motion.g>
      </motion.g>
      <Chip x={14} y={176} width={86} label="Revista" />
      <Chip x={294} y={176} width={100} label="Escaparate" />
      <Chip x={44} y={224} width={92} label="Buzoneo" />
      <Chip x={262} y={224} width={104} label="Puerta fría" />
    </Scene>
  );
}

// 2000: el primer portal, en un monitor, y la obra nueva creciendo al lado.
function Scene2000() {
  const rows = [76, 112, 148];
  return (
    <Scene gap={0.11}>
      <motion.g variants={piece}>
        <rect x="42" y="34" width="232" height="168" rx="14" fill={INK} />
        <rect x="54" y="46" width="208" height="144" rx="6" fill="#FFF8F1" />
        <rect x="54" y="46" width="208" height="20" rx="6" fill={ORANGE} />
        <rect x="136" y="202" width="44" height="26" fill={INK} />
        <rect x="104" y="228" width="108" height="10" rx="5" fill={INK} />
      </motion.g>
      {rows.map((y) => (
        <motion.g key={y} variants={piece}>
          <rect x="66" y={y} width="40" height="28" rx="4" fill={PEACH} />
          <rect x="116" y={y + 3} width="120" height="8" rx="4" fill={INK} />
          <rect x="116" y={y + 17} width="80" height="7" rx="3.500" fill="#D4D4D4" />
        </motion.g>
      ))}
      <motion.path variants={draw} d="M286 238h92" stroke={PEACH} strokeWidth="4" strokeLinecap="round" fill="none" />
      <motion.rect variants={rise} style={base} x="294" y="140" width="34" height="98" rx="3" fill="#FFFFFF" stroke={INK} strokeWidth="3" />
      <motion.rect variants={rise} style={base} x="334" y="96" width="36" height="142" rx="3" fill={ORANGE} />
      {[112, 136, 160, 184, 208].map((y) => (
        <motion.rect key={y} variants={pop} style={center} x="344" y={y} width="16" height="10" rx="2" fill="#FFFFFF" />
      ))}
      <motion.path variants={draw} d="M312 140V56h58M312 72l32-16" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Scene>
  );
}

function SmallHouse({ x, y, sold = false }: { x: number; y: number; sold?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g variants={pop} style={center}>
        <path d="M2 21 22 4l20 17" fill="none" stroke={INK} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 18 22 7l13 11v20H9Z" fill={sold ? ORANGE : '#FFFFFF'} stroke={INK} strokeWidth="2" />
        <rect x="18" y="24" width="8" height="14" rx="1" fill={sold ? '#FFFFFF' : PEACH} />
      </motion.g>
    </g>
  );
}

function Person({ x }: { x: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <motion.g variants={piece}>
        <circle cx="0" cy="204" r="12" fill={INK} />
        <path d="M-20 262c0-22 8-34 20-34s20 12 20 34Z" fill={INK} />
      </motion.g>
    </g>
  );
}

// 2010: muchas casas en venta y muy pocos compradores.
function Scene2010() {
  const houses = [0, 1, 2].flatMap((row) => [0, 1, 2, 3].map((col) => ({ x: 34 + col * 56, y: 62 + row * 62, sold: row === 0 && col === 0 })));
  return (
    <Scene gap={0.05}>
      {houses.map((h) => (
        <SmallHouse key={`${h.x}-${h.y}`} {...h} />
      ))}
      <motion.path variants={draw} d="M30 34c74 0 150 10 214 34l92 76" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" fill="none" />
      <motion.path variants={draw} d="M312 146l26 2-2-26" stroke={ORANGE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Person x={310} />
      <Person x={358} />
    </Scene>
  );
}

function Pin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <motion.g variants={pop} style={center}>
        <path d="M16 44S0 25 0 15a16 16 0 0 1 32 0c0 10-16 29-16 29Z" fill={ORANGE} stroke={INK} strokeWidth="3" />
        <circle cx="16" cy="15" r="5.500" fill="#FFFFFF" />
      </motion.g>
    </g>
  );
}

// 2020: todo el mundo en el mismo portal y cada vez más agencias alrededor.
function Scene2020() {
  const cards = [0, 1, 2].flatMap((row) => [0, 1, 2].map((col) => ({ x: 106 + col * 66, y: 74 + row * 56 })));
  return (
    <Scene gap={0.07}>
      <motion.g variants={piece}>
        <rect x="88" y="34" width="224" height="228" rx="14" fill="#FFFFFF" stroke={INK} strokeWidth="4" />
        <path d="M88 48a14 14 0 0 1 14-14h196a14 14 0 0 1 14 14v12H88Z" fill={INK} />
        <circle cx="106" cy="47" r="4" fill={ORANGE} />
        <circle cx="120" cy="47" r="4" fill={PEACH} />
      </motion.g>
      {cards.map((c, i) => (
        <motion.g key={i} variants={pop} style={center}>
          <rect x={c.x} y={c.y} width="56" height="46" rx="6" fill={i === 4 ? ORANGE : '#FFF0E5'} />
          <rect x={c.x + 8} y={c.y + 32} width="30" height="6" rx="3" fill={i === 4 ? '#FFFFFF' : PEACH} />
        </motion.g>
      ))}
      <Pin x={30} y={56} />
      <Pin x={50} y={176} />
      <Pin x={336} y={76} />
      <Pin x={350} y={196} />
    </Scene>
  );
}

// 2026: la captación pasa por el móvil; el cartel se queda atrás.
function Scene2026() {
  return (
    <Scene gap={0.1}>
      {[0, 1.3].map((delay) => (
        <motion.circle
          key={delay}
          style={center}
          cx="200"
          cy="150"
          r="120"
          fill="none"
          stroke={ORANGE}
          strokeWidth="2"
          animate={{ scale: [0.72, 1.18], opacity: [0.55, 0] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeOut', delay }}
        />
      ))}
      <motion.g variants={piece} style={{ opacity: 0.4 }}>
        <g transform="rotate(-14 62 210)" opacity="0.45">
          <SellSign x={8} y={176} scale={0.5} />
        </g>
      </motion.g>
      <motion.g variants={piece}>
        <rect x="134" y="10" width="132" height="280" rx="24" fill="#FFFFFF" stroke="#525252" strokeWidth="5" />
        <rect x="178" y="20" width="44" height="7" rx="3.500" fill="#D4D4D4" />
      </motion.g>
      <motion.g variants={piece}>
        <circle cx="156" cy="50" r="10" fill={ORANGE} />
        <rect x="172" y="42" width="60" height="7" rx="3.500" fill={INK} />
        <rect x="172" y="54" width="38" height="6" rx="3" fill="#D4D4D4" />
      </motion.g>
      <motion.g variants={piece}>
        <text x="200" y="84" textAnchor="middle" fontSize="11.500" fontWeight="800" fill={INK}>
          ¿Quieres vender
        </text>
        <text x="200" y="99" textAnchor="middle" fontSize="11.500" fontWeight="800" fill={INK}>
          tu vivienda?
        </text>
      </motion.g>
      <motion.g variants={piece}>
        <rect x="146" y="108" width="108" height="118" rx="12" fill="#FFDDB8" />
        <path d="M168 176l32-28 32 28" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M178 170l22-18 22 18v40h-44Z" fill="#FFFFFF" />
        <rect x="192" y="182" width="16" height="28" rx="2" fill={ORANGE} />
      </motion.g>
      <motion.g variants={pop} style={center}>
        <rect x="146" y="238" width="108" height="30" rx="10" fill={ORANGE} />
        <text x="200" y="258" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF">
          Quiero vender
        </text>
      </motion.g>
      <motion.g variants={pop} style={center}>
        <motion.g animate={{ y: [0, -7, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
          <circle cx="322" cy="84" r="27" fill={ORANGE} />
          <path d="M322 98s-17-10-17-22c0-11 13-13 17-4 4-9 17-7 17 4 0 12-17 22-17 22Z" fill="#FFFFFF" />
        </motion.g>
      </motion.g>
    </Scene>
  );
}

const TIMELINE = [
  { year: '1990', title: 'Métodos tradicionales', text: 'Revista, escaparate, buzoneo y puerta fría.', Scene: Scene1990 },
  { year: '2000', title: 'Primera etapa digital', text: 'Nacen los portales inmobiliarios y crece la obra nueva.', Scene: Scene2000 },
  { year: '2010', title: 'Crisis inmobiliaria', text: 'Más viviendas que compradores. Las inmobiliarias empiezan a vender a través de portales.', Scene: Scene2010 },
  { year: '2020', title: 'La era de los portales', text: 'El 90% de las inmobiliarias publica en portales [fuente]. Cada vez más aperturas y más dificultad para captar.', Scene: Scene2020 },
  { year: '2026', title: 'Hoy', text: 'Escasez de vivienda, más competencia y menos referidos. Tu cliente ideal está en una pantalla.', Scene: Scene2026 },
];

const LAST = TIMELINE.length - 1;

// El año gira cifra a cifra: solo se mueven las que cambian.
function RollingYear({ year }: { year: string }) {
  return (
    <span aria-hidden="true" className="flex text-6xl font-extrabold leading-none tracking-[-0.04em] md:text-8xl">
      {year.split('').map((digit, i) => (
        <span key={i} className="relative inline-flex overflow-hidden px-[0.015em] py-[0.04em]">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={digit}
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.45, ease: EXPO, delay: i * 0.04 }}
              className="block"
            >
              {digit}
            </motion.span>
          </AnimatePresence>
        </span>
      ))}
    </span>
  );
}

function Segment({ fill }: { fill: MotionValue<number> | number }) {
  return (
    <span className="block h-1 overflow-hidden rounded-full bg-[#FFD3A1]/60">
      <motion.span className="block h-full origin-left rounded-full bg-[#FF8000]" style={{ scaleX: fill }} />
    </span>
  );
}

function LineReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <span className="block overflow-hidden pb-[0.12em]">
      <motion.span
        className="block"
        initial={{ y: '105%' }}
        whileInView={{ y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.8, ease: EXPO, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function TimeMachine() {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovering, setHovering] = useState(false);
  const progress = useMotionValue(0);

  useEffect(() => {
    if (reduced) progress.set(1);
  }, [reduced, progress]);

  const running = inView && !paused && !hovering && !reduced;

  useAnimationFrame((_, delta) => {
    if (!running) return;
    const next = progress.get() + Math.min(delta, 50) / STEP_MS;
    if (next < 1) {
      progress.set(next);
    } else if (index < LAST) {
      progress.set(0);
      setIndex(index + 1);
    } else {
      progress.set(1);
      setPaused(true);
    }
  });

  const pick = (i: number) => {
    setIndex(i);
    progress.set(1);
    setPaused(true);
  };

  const toggle = () => {
    if (!paused) {
      setPaused(true);
      return;
    }
    if (progress.get() >= 1) {
      progress.set(0);
      if (index === LAST) setIndex(0);
    }
    setPaused(false);
  };

  const step = TIMELINE[index];

  return (
    <div
      ref={rootRef}
      onPointerEnter={(e) => e.pointerType === 'mouse' && setHovering(true)}
      onPointerLeave={() => setHovering(false)}
      className="mt-6 md:mt-10"
    >
      <div className="grid grid-cols-1 items-center gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-12">
        <div className="order-2 lg:order-1">
          <RollingYear year={step.year} />
          {/* Todos los textos ocupan la misma celda: la altura no salta al cambiar
              de año y los buscadores leen la historia entera. */}
          <div className="mt-3 grid md:mt-4">
            {TIMELINE.map((t, i) => (
              <motion.div
                key={t.year}
                initial={false}
                animate={{ opacity: i === index ? 1 : 0, y: i === index ? 0 : 10 }}
                transition={{ duration: 0.4, ease: EXPO, delay: i === index ? 0.12 : 0 }}
                aria-hidden={i !== index}
                className={`[grid-area:1/1] ${i === index ? '' : 'pointer-events-none'}`}
              >
                <h3 className="text-lg font-extrabold tracking-tight text-[#C2410C] md:text-2xl">{t.title}</h3>
                <p className="mt-1.5 max-w-md text-[15px] leading-relaxed text-neutral-600 md:mt-2 md:text-lg">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative order-1 mx-auto aspect-[4/3] w-full max-w-[15.5rem] md:max-w-[26rem] lg:order-2 lg:max-w-[28rem]">
          <AnimatePresence mode="wait" initial={false}>
            <step.Scene key={step.year} />
          </AnimatePresence>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 md:mt-8 md:gap-5">
        <ol className="grid min-w-0 flex-1 grid-cols-5 gap-1.5 md:gap-3">
          {TIMELINE.map((t, i) => (
            <li key={t.year}>
              <button
                type="button"
                onClick={() => pick(i)}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`${t.year}: ${t.title}`}
                className="group flex min-h-11 w-full cursor-pointer flex-col justify-center gap-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]"
              >
                <Segment fill={i === index ? progress : i < index ? 1 : 0} />
                <span
                  className={`text-xs font-bold tabular-nums transition-colors duration-200 md:text-sm ${
                    i === index ? 'text-[#C2410C]' : 'text-neutral-600 group-hover:text-black'
                  }`}
                >
                  {t.year}
                </span>
              </button>
            </li>
          ))}
        </ol>
        {!reduced && (
          <button
            type="button"
            onClick={toggle}
            aria-label={paused ? 'Reproducir la historia' : 'Pausar la historia'}
            className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full border border-neutral-300 text-black transition-[border-color,transform] duration-150 ${SNAPPY} hover:border-black active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000]`}
          >
            {paused ? <Play size={15} fill="currentColor" strokeWidth={0} className="ml-0.5" aria-hidden="true" /> : <Pause size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />}
          </button>
        )}
      </div>
    </div>
  );
}

function Side({ from, delay, children }: { from: number; delay: number; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: from }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.65, ease: EXPO, delay }}
      className="flex items-center gap-4 md:gap-5"
    >
      {children}
    </motion.div>
  );
}

function CardIcon({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <motion.span
      initial={{ scale: 0.5, opacity: 0 }}
      whileInView={{ scale: 1, opacity: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ type: 'spring', duration: 0.6, bounce: 0.35, delay: 0.25 }}
      className={`flex size-12 shrink-0 items-center justify-center rounded-full md:size-14 ${className}`}
    >
      {children}
    </motion.span>
  );
}

export function EvolutionSection() {
  return (
    <section className="w-full overflow-hidden bg-[#FFF8F1] py-12 md:py-24">
      <div className="mx-auto w-full max-w-[87.5rem] px-5 md:px-10">
        <div className="max-w-3xl">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EXPO }}
            className="text-sm font-bold text-[#C2410C]"
          >
            Historia y evolución del sector inmobiliario
          </motion.p>
          <h2 className="mt-3 text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] md:text-5xl 2xl:text-6xl">
            <LineReveal>Antes miraban carteles.</LineReveal>
            <LineReveal delay={0.12}>
              <span className="text-[#E67300]">Ahora miran pantallas.</span>
            </LineReveal>
          </h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, ease: EXPO, delay: 0.25 }}
            className="mt-3 text-base leading-relaxed text-neutral-600 md:text-lg"
          >
            El sector inmobiliario sigue siendo el mismo. Lo que ha cambiado son los hábitos de las personas.
          </motion.p>
        </div>

        <TimeMachine />

        <hr className="mt-8 border-[#FFD3A1] md:mt-12" />

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: EXPO }}
          className="mt-8 max-w-4xl text-xl font-extrabold leading-snug tracking-[-0.02em] md:mt-12 md:text-3xl"
        >
          Las inmobiliarias cambiaron su forma de buscar compradores. <span className="text-[#E67300]">Ahora toca cambiar cómo captar vendedores.</span>
        </motion.p>

        <div className="mt-6 grid grid-cols-1 gap-5 md:mt-9 md:grid-cols-2 md:gap-12">
          <Side from={-28} delay={0}>
            <CardIcon className="bg-[#0D0D0D] text-white">
              <MonitorUp size={24} aria-hidden="true" />
            </CardIcon>
            <p className="text-lg font-extrabold leading-snug tracking-[-0.01em] md:text-xl">
              Los compradores te llegan por <span className="text-[#C2410C]">los portales.</span>
            </p>
          </Side>
          <Side from={28} delay={0.08}>
            <CardIcon className="bg-[#FF8000] text-white">
              <Users size={24} aria-hidden="true" />
            </CardIcon>
            <div>
              <p className="text-balance text-lg font-extrabold leading-snug tracking-[-0.01em] md:text-xl">
                Nosotros hacemos que <span className="text-[#C2410C]">los vendedores te encuentren a ti.</span>
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">Y si lo necesitas, también compradores o la campaña que pida tu inmobiliaria.</p>
            </div>
          </Side>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EXPO, delay: 0.1 }}
          className="mt-6 flex items-start gap-3 md:mt-9 md:items-center"
        >
          <ShieldCheck size={26} aria-hidden="true" className="shrink-0 text-[#E67300]" />
          <p className="text-base font-medium leading-snug md:text-lg">
            Nuestro equipo lleva <strong className="font-extrabold">más de 11 años</strong> visitando a <strong className="font-extrabold">[miles de]</strong> inmobiliarias.{' '}
            <span className="font-extrabold text-[#C2410C]">Cosiris: un equipo que entiende tu inmobiliaria.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
