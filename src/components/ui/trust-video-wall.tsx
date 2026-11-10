import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { CLIENT_LOGOS } from '@/data/client-logos';
import { navigateTo } from '@/lib/utils';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];
const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';

// Hero: el mensaje sobre un fondo de estrellas y, debajo, el carrusel de
// inmobiliarias y las cifras.

const METRICS = [
  { value: '+11 años', label: 'en el sector inmobiliario' },
  { value: '+1.000', label: 'inmobiliarias visitadas' },
  { value: '72 h', label: 'para tener tu servicio activo' },
];

const QUICK_LINKS = [
  { label: 'Campañas', href: '/servicios#ads' },
  { label: 'Redes sociales', href: '/servicios#redes' },
  { label: 'Email marketing', href: '/servicios#email' },
  { label: 'Calculadora ROI', href: '/calculadora-roi' },
];

// Reparto con la proporción áurea: parece aleatorio pero siempre es el mismo,
// sin grumos. Una de cada tres parpadea; una de cada siete es una estrella de
// cuatro puntas.
const STARS = Array.from({ length: 90 }, (_, i) => ({
  left: (i * 61.803) % 100,
  top: (i * 38.197 + (i % 5) * 7) % 100,
  size: 2 + (i % 3),
  orange: i % 4 === 0,
  sparkle: i % 7 === 3,
  twinkle: i % 3 === 0,
  delay: (i % 6) * 0.8,
  // Ninguna detrás del mensaje: entre las letras parecerían signos de puntuación.
})).filter((s) => !(s.left > 16 && s.left < 84 && s.top > 8 && s.top < 62));

function StarField() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {STARS.map((s, i) => {
        const style = {
          left: `${s.left}%`,
          top: `${s.top}%`,
          animationDelay: `${s.delay}s`,
        };
        const motionClass = s.twinkle ? 'animate-twinkle' : 'opacity-60';
        return s.sparkle ? (
          <svg key={i} viewBox="0 0 24 24" className={`absolute size-3.5 ${motionClass}`} style={style} fill={s.orange ? '#FF8000' : '#D4D4D4'}>
            <path d="M12 0c1 7.5 4.5 11 12 12-7.500 1-11 4.500-12 12-1-7.500-4.500-11-12-12 7.500-1 11-4.500 12-12Z" />
          </svg>
        ) : (
          <span
            key={i}
            className={`absolute rounded-full ${s.orange ? 'bg-[#FF8000]' : 'bg-neutral-300'} ${motionClass}`}
            style={{ ...style, width: s.size, height: s.size }}
          />
        );
      })}
    </div>
  );
}

// El duplicado del carrusel existe solo para que el bucle no se corte: sus enlaces
// quedan fuera del tabulador. Las inmobiliarias sin ficha no llevan enlace.
function LogoBubble({ logo, duplicate }: { logo: (typeof CLIENT_LOGOS)[number]; duplicate: boolean }) {
  const circle = (
    <span
      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] ring-1 ring-black/5 md:size-20"
    >
      <img src={logo.circle ?? logo.src} alt={logo.profile ? '' : logo.alt} title={logo.alt} decoding="async" className="h-full w-full object-cover" />
    </span>
  );
  if (!logo.profile) return circle;

  const href = `/inmobiliarias-en-${logo.profile}`;
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateTo(href);
      }}
      aria-label={`Ver la ficha de ${logo.alt}`}
      tabIndex={duplicate ? -1 : undefined}
      className={`block shrink-0 rounded-full transition-transform duration-200 ${SNAPPY} hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2`}
    >
      {circle}
    </a>
  );
}

const FADE_SIDES = 'linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)';

export function TrustVideoWall() {
  return (
    <section aria-labelledby="trust-wall-title" className="relative flex w-full flex-col overflow-hidden bg-white text-[#0A0A0A] xl:min-h-[calc(100svh-6rem)]">
      <StarField />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 pt-8 pb-4 text-center md:pt-20 md:pb-10">
        <motion.h1
          id="trust-wall-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EXPO }}
          className="max-w-[22ch] text-balance text-[2.1rem] font-extrabold leading-[1.08] tracking-[-0.03em] md:text-6xl"
        >
          Plataforma de marketing y captación <span className="text-[#E67300]">para inmobiliarias</span>
        </motion.h1>

        <p className="mt-4 text-balance text-[11px] font-bold uppercase tracking-[0.04em] text-[#E67300] min-[400px]:text-xs min-[400px]:tracking-[0.08em] sm:text-sm md:mt-6 md:text-base md:tracking-[0.12em]">
          Marketing · Captación · Automatizaciones IA
        </p>

        <div className="mt-5 flex flex-col items-center gap-1 sm:flex-row sm:gap-3 md:mt-7">
          <a
            href="#servicios"
            className={`group inline-flex min-h-12 items-center gap-2 rounded-lg bg-[#FF8000] px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#E67300] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
          >
            Conoce nuestros servicios
            <ArrowRight size={16} className={`transition-transform duration-200 ${SNAPPY} group-hover:translate-x-0.5`} />
          </a>
          <a
            href="#testimonios"
            className="inline-flex min-h-12 items-center px-5 text-sm font-semibold underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
          >
            Ver testimonios
          </a>
        </div>

        <nav aria-label="Servicios" className="mt-3 hidden max-w-xl flex-wrap justify-center gap-x-5 sm:flex">
          {QUICK_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(l.href);
              }}
              className="inline-flex min-h-11 items-center text-[13px] font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 hover:text-black hover:decoration-[#E67300] focus-visible:decoration-[#E67300] focus-visible:outline-none"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Carrusel: se pausa al pasar el ratón, al tocarlo o al tabular dentro. */}
      <div className="relative">
        <p className="px-5 pb-3 text-center text-sm font-medium text-neutral-600">Inmobiliarias que ya captan con Cosiris · pulsa un logo para ver su minisite</p>
        <div className="group overflow-hidden" style={{ maskImage: FADE_SIDES, WebkitMaskImage: FADE_SIDES }}>
          <div className="animate-marquee -mb-6 flex w-max items-center pt-2 pb-8" style={{ animationDuration: '120s' }}>
            {[false, true].map((hidden) => (
              <div key={String(hidden)} aria-hidden={hidden || undefined} className="flex items-center gap-4 pr-4 md:gap-8 md:pr-8">
                {CLIENT_LOGOS.map((logo) => (
                  <LogoBubble key={logo.src} logo={logo} duplicate={hidden} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5 pt-3 pb-8 md:pt-6 md:pb-24">
        <dl className="grid grid-cols-3 divide-x divide-neutral-200 rounded-2xl border border-neutral-200 bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
          {METRICS.map((m) => (
            <div key={m.value} className="flex flex-col items-center gap-1 px-2 py-3 text-center md:px-6 md:py-6">
              <dd className="order-1 text-lg font-extrabold tracking-[-0.02em] text-[#E67300] md:text-3xl">{m.value}</dd>
              <dt className="order-2 text-[11px] leading-tight text-neutral-600 md:text-sm md:leading-normal">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
