import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const BASE =
  'flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>li]:w-[86%] [&>li]:max-w-[22rem] [&>li]:shrink-0 [&>li]:snap-start';

type Props = {
  children: React.ReactNode;
  /** Márgenes a sangre y, si procede, cómo deja de ser fila en pantallas grandes. */
  className?: string;
  /** Oculta las flechas cuando la fila ya no se desliza. */
  arrowsClassName?: string;
  dark?: boolean;
  label: string;
};

// Fila que se desliza con el dedo: en móvil sustituye a las pilas de tarjetas para
// ahorrar scroll. La tarjeta siguiente asoma por el borde y las flechas dicen que
// hay más, y permiten pasar sin gesto.
export function SwipeRow({ children, className = '', arrowsClassName = '', dark = false, label }: Props) {
  const rowRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const row = rowRef.current;
    if (!row) return;
    setEdges({ start: row.scrollLeft < 8, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 8 });
  }, []);

  // ResizeObserver avisa después de calcular el diseño (y una vez al empezar):
  // medir en el montaje obligaba al navegador a recalcular toda la página antes
  // de tiempo (Lighthouse: "redistribución forzada", ~200 ms en móvil).
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const observer = new ResizeObserver(update);
    observer.observe(row);
    return () => observer.disconnect();
  }, [update]);

  const move = (direction: 1 | -1) => {
    const row = rowRef.current;
    const first = row?.firstElementChild as HTMLElement | null;
    if (!row || !first) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.scrollBy({ left: direction * (first.offsetWidth + 12), behavior: reduced ? 'auto' : 'smooth' });
  };

  const arrow = `flex size-11 cursor-pointer items-center justify-center rounded-full border transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] disabled:cursor-default disabled:opacity-30 ${
    dark ? 'border-white/30 text-white' : 'border-neutral-300 text-black'
  }`;

  return (
    <>
      <ul ref={rowRef} onScroll={update} aria-label={label} className={`${BASE} ${className}`}>
        {children}
      </ul>
      <div className={`mt-4 flex justify-center gap-3 ${arrowsClassName}`}>
        <button type="button" onClick={() => move(-1)} disabled={edges.start} aria-label="Anterior" className={arrow}>
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => move(1)} disabled={edges.end} aria-label="Siguiente" className={arrow}>
          <ArrowRight size={18} aria-hidden="true" />
        </button>
      </div>
    </>
  );
}
