import { useEffect, useRef, useState } from 'react';
import { CLIENT_LOGOS } from '@/data/client-logos';
import { navigateTo } from '@/lib/utils';
import { useFittedLogo } from '@/lib/fit-logo';

const VISIBLE = 9;
const GRID = 15;
const GRID_PHONE = 10;
const SECONDS = 28;
// Caja en la línea del resto de la web: caras claras, contorno fino naranja
// suave y una franja de marca, sin el trazo marrón grueso de dibujo animado.
const EDGE = '#F0B27A';
const BOX = 'hop-box pointer-events-none absolute right-0 bottom-3 h-40 w-[13.5rem] origin-bottom md:h-44 md:w-60';

// circle: logo ya preparado para el círculo (los locales); los del directorio no lo traen.
type Bubble = { src: string; alt: string; href: string; bg?: string; cover?: boolean; circle?: boolean };

// Hasta que llega el directorio (o si falla) se usan los logos locales.
const FALLBACK: Bubble[] = CLIENT_LOGOS.filter((l) => l.profile).map((l) => ({
  src: l.circle ?? l.src,
  circle: Boolean(l.circle),
  alt: l.alt,
  bg: l.bg,
  cover: l.cover,
  href: `/inmobiliarias-en-${l.profile}`,
}));

function shuffle<T>(list: T[]): T[] {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

// El directorio se pide al acercarse a la sección y por import dinámico: Supabase
// no debe entrar en el bundle principal de la home.
async function loadDirectory() {
  const [{ fetchLiveInmobiliarias }, { agencyProfilePath }] = await Promise.all([
    import('@/data/live-inmobiliarias'),
    import('@/lib/agency-url'),
  ]);
  const agencies = await fetchLiveInmobiliarias();
  // Una misma inmobiliaria puede estar varias veces en el directorio (sedes o
  // fichas repetidas): se muestra una sola burbuja por nombre, enlace y logo.
  const clave = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const vistos = new Set<string>();
  const bubbles: Bubble[] = [];
  for (const a of agencies) {
    if (!a.logo_url) continue;
    const href = agencyProfilePath(a, agencies);
    const nombre = clave(a.nombre_comercial);
    const claves = [`n:${nombre}`, `h:${href}`, `l:${a.logo_url}`];
    if (claves.some((k) => vistos.has(k))) continue;
    claves.forEach((k) => vistos.add(k));
    // Si es una de nuestras inmobiliarias, mejor el logo local preparado para el círculo.
    const local = FALLBACK.find((l) => l.href === href && l.circle);
    bubbles.push(local ? { ...local, alt: a.nombre_comercial.trim() } : { src: a.logo_url as string, alt: a.nombre_comercial.trim(), href });
  }
  return { bubbles };
}

function HopBubble({ logo, onBroken }: { logo: Bubble; onBroken: (logo: Bubble) => void }) {
  // Los logos del directorio se ajustan al círculo al cargar; si no se puede
  // (servidor sin CORS) se pintan como antes, con margen.
  const fitted = useFittedLogo(logo.circle ? null : logo.src);
  const filled = logo.circle || fitted !== null || logo.cover;
  const { href } = logo;
  return (
    <a
      href={href}
      onClick={(e) => {
        e.preventDefault();
        navigateTo(href);
      }}
      aria-label={`Ver la ficha de ${logo.alt}`}
      className="group/bubble relative block rounded-full transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-110 focus-visible:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2"
    >
      <span
        className={`flex size-14 items-center justify-center overflow-hidden rounded-full shadow-[0_6px_16px_rgba(0,0,0,0.12)] ring-1 ring-black/5 md:size-[4.5rem] ${filled ? '' : 'p-2 md:p-2.5'}`}
        style={{ backgroundColor: logo.circle || fitted ? '#FFFFFF' : (logo.bg ?? '#FFFFFF') }}
      >
        <img src={fitted ?? logo.src} alt="" loading="lazy" decoding="async" onError={() => onBroken(logo)} className={filled ? 'h-full w-full object-cover' : 'max-h-full max-w-full object-contain'} />
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap xl:block rounded-full bg-black px-3 py-1 text-xs font-semibold text-white opacity-0 transition-opacity duration-150 group-hover/bubble:opacity-100 group-focus-visible/bubble:opacity-100">
        {logo.alt}
      </span>
    </a>
  );
}

// Las inmobiliarias avanzan a saltos y, al llegar, dan un salto más alto por
// encima de la solapa y caen dentro de la caja. Todo el recorrido es una sola
// animación CSS (.hop), con una burbuja saliendo a cada intervalo.
// Cada burbuja enlaza a la ficha de la inmobiliaria: por eso solo salen las que
// tienen ficha, y al pasar el ratón o tabular dentro todo se detiene para poder
// pulsarlas.
// Los logos salen del directorio real. En pantalla solo hay unas pocas burbujas:
// cada una cambia de inmobiliaria al reiniciar su recorrido, cuando es invisible,
// así pasan todas sin cargar más de cien imágenes de golpe. Un logo que no carga
// se retira de la rotación.
// La caja son dos capas: el interior va detrás de las burbujas y las caras y
// solapas delante, así la burbuja desaparece dentro de verdad.
// La animación necesita una pista ancha: por debajo de 1280 px las burbujas se
// amontonarían, así que se muestran en una cuadrícula para tocarlas. Lo mismo
// con "reducir movimiento".
export function LogosHop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [pool, setPool] = useState<Bubble[]>(FALLBACK);
  const [slots, setSlots] = useState<Bubble[]>(FALLBACK.slice(0, VISIBLE));
  const queue = useRef<Bubble[]>(FALLBACK.slice(VISIBLE));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadDirectory()
          .then(({ bubbles }) => {
            if (cancelled || bubbles.length === 0) return;
            const mixed = shuffle(bubbles);
            setPool(mixed);
            setSlots(mixed.slice(0, VISIBLE));
            queue.current = mixed.slice(VISIBLE);
          })
          .catch(() => undefined);
      },
      { rootMargin: '800px 0px' },
    );
    observer.observe(root);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  const nextInSlot = (slot: number) => {
    const next = queue.current.shift();
    if (!next) return;
    setSlots((current) => {
      queue.current.push(current[slot]);
      return current.map((b, i) => (i === slot ? next : b));
    });
  };

  const dropBroken = (logo: Bubble) => {
    queue.current = queue.current.filter((b) => b.href !== logo.href);
    setPool((current) => current.filter((b) => b.href !== logo.href));
    setSlots((current) => {
      if (!current.includes(logo)) return current;
      const next = queue.current.shift();
      return next ? current.map((b) => (b === logo ? next : b)) : current;
    });
  };

  const interval = SECONDS / VISIBLE;
  const beat = { animationDuration: `${interval}s` };

  return (
    <div ref={rootRef}>
      <p className="mb-2 text-center text-base font-medium text-slate-700">Todos estos clientes ya confían en nosotros</p>
      <div className="hop-track relative hidden h-64 xl:block motion-reduce:hidden">
        <span aria-hidden="true" className="absolute right-0 bottom-3 left-0 border-b-2 border-dashed border-neutral-200" />

        <svg aria-hidden="true" viewBox="0 0 240 180" overflow="visible" className={BOX} style={beat} strokeLinejoin="round">
          <ellipse cx="128" cy="174" rx="112" ry="7" fill="#C2410C" opacity="0.1" />
          <path d="M72 18h128l10-16H86Z" fill="#FFF0E5" stroke={EDGE} strokeWidth="1.5" />
          <path d="M30 58 72 18h128l-50 40Z" fill="#E9944F" />
          <path d="M72 18h128l-14 13H80Z" fill="#C9692A" opacity="0.45" />
          <path d="M72 18 30 58v14l42-40Z" fill="#D27C3C" />
        </svg>

        <ul className="absolute inset-0">
          {slots.map((l, i) => (
            <li
              key={i}
              className="hop absolute bottom-4 left-0"
              style={{ animationDuration: `${SECONDS}s`, animationDelay: `${-i * interval}s` }}
              onAnimationIteration={() => nextInSlot(i)}
            >
              <HopBubble logo={l} onBroken={dropBroken} />
            </li>
          ))}
        </ul>

        <div aria-hidden="true" className={`${BOX} z-10 drop-shadow-[0_16px_22px_rgba(194,65,12,0.16)]`} style={beat}>
          <svg viewBox="0 0 240 180" className="absolute inset-0 h-full w-full" strokeLinejoin="round">
            <path d="M150 58 200 18v112l-50 40Z" fill="#FFE3C7" stroke={EDGE} strokeWidth="1.5" />
            <path d="M150 158 200 118v12l-50 40Z" fill="#E67300" />
            <path d="M150 58 200 18l30 34-48 38Z" fill="#FFD3A1" stroke={EDGE} strokeWidth="1.5" />
            <path d="M30 58h120v112H30Z" fill="#FFFFFF" stroke={EDGE} strokeWidth="1.5" />
            <path d="M30 100h92l28-42v18l-20 32H30Z" fill="#FFF4EA" />
            <path d="M30 158h120v12H30Z" fill="#FF8000" />
            <path d="M30 58h120l-28 42H4Z" fill="#FFF0E5" stroke={EDGE} strokeWidth="1.5" />
            <path d="M14 94 34 64h96" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="absolute top-[60%] left-[12.5%] flex w-1/2 flex-col items-center leading-tight text-black">
            <img src="/assets/logo_black.png" alt="" width={380} height={170} className="h-7 w-auto md:h-8" />
            <span className="mt-0.5 text-[10px] font-bold md:text-[11px]">+1.000 visitadas</span>
          </span>
        </div>
      </div>

      <ul className="flex flex-wrap justify-center gap-4 md:gap-6 xl:hidden motion-reduce:flex">
        {pool.slice(0, GRID).map((l, i) => (
          <li key={l.href} className={i >= GRID_PHONE ? 'hidden sm:block' : undefined}>
            <HopBubble logo={l} onBroken={dropBroken} />
          </li>
        ))}
      </ul>
    </div>
  );
}
