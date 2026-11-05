import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { agencyProfilePath } from '@/lib/agency-url';
import { optimizedImageUrl } from '@/lib/image-optimize';
import { navigateTo, rememberDirectoryUrl } from '@/lib/utils';

const SLOTS = 18;
const PHONE_SLOTS = 15;
const STEP_MS = 2200;
// Salto entre logos: no es divisor de 15, así recorre todos sin ir en fila.
const HOP = 7;

// La red de inmobiliarias con datos reales: logos del directorio en una rejilla
// que encaja en cualquier ancho y un marcador que salta de una a otra, como una
// búsqueda que encuentra tu inmobiliaria. Cada logo abre su ficha; el que no carga
// se retira para no dejar huecos.
export function AgencyNetworkIllustration({ agencies }: { agencies: InmobiliariaPublica[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3 });
  const reduced = useReducedMotion();
  const [broken, setBroken] = useState<ReadonlySet<string>>(new Set());
  const [active, setActive] = useState(0);

  const shown = useMemo(
    () => agencies.filter((a) => a.logo_url && !broken.has(a.id)).slice(0, SLOTS),
    [agencies, broken],
  );
  const cycle = Math.min(shown.length, PHONE_SLOTS);

  useEffect(() => {
    if (!inView || reduced || cycle === 0) return;
    const t = setInterval(() => setActive((i) => (i + HOP) % cycle), STEP_MS);
    return () => clearInterval(t);
  }, [inView, reduced, cycle]);

  const current = shown[active % Math.max(cycle, 1)];

  return (
    <div ref={rootRef} className="rounded-3xl bg-[#FFF8F1] p-4 sm:p-6">
      <ul className="grid grid-cols-5 gap-2 sm:grid-cols-6 sm:gap-3">
        {shown.length === 0
          ? Array.from({ length: SLOTS }, (_, i) => (
              <li key={i} className={`aspect-square rounded-full bg-white ${i >= PHONE_SLOTS ? 'hidden sm:block' : ''}`} />
            ))
          : shown.map((agency, i) => {
              const isActive = agency.id === current?.id;
              return (
                <li key={agency.id} className={i >= PHONE_SLOTS ? 'hidden sm:block' : undefined}>
                  <button
                    type="button"
                    onClick={() => {
                      rememberDirectoryUrl();
                      navigateTo(agencyProfilePath(agency, agencies));
                    }}
                    onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
                    aria-label={`Ver la ficha de ${agency.nombre_comercial}`}
                    className={`block aspect-square w-full cursor-pointer overflow-hidden rounded-full bg-white p-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.07)] ring-2 transition-[transform,box-shadow] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:outline-none focus-visible:ring-black sm:p-2 ${
                      isActive ? 'scale-110 ring-[#FF8000]' : 'ring-transparent'
                    }`}
                  >
                    <img
                      src={optimizedImageUrl(agency.logo_url as string, 120)}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      onError={() => setBroken((prev) => new Set(prev).add(agency.id))}
                      className="h-full w-full object-contain"
                    />
                  </button>
                </li>
              );
            })}
      </ul>

      <div className="mt-4 flex min-h-7 items-center justify-center overflow-hidden text-sm font-semibold sm:mt-5 sm:text-base" aria-live="off">
        <AnimatePresence mode="wait" initial={false}>
          {current && (
            <motion.p
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}
              className="flex min-w-0 items-center gap-1.5"
            >
              <MapPin size={16} aria-hidden="true" className="shrink-0 text-[#E67300]" />
              <span className="truncate">
                {current.nombre_comercial.trim()}
                {current.poblacion ? <span className="font-medium text-neutral-600"> · {current.poblacion}</span> : null}
              </span>
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
