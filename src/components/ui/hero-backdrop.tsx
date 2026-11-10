const DOTS = { backgroundImage: 'radial-gradient(#FFB877 1.4px, transparent 1.6px)', backgroundSize: '18px 18px' };

// Decoración ambiental: círculos grandes, curvas, puntos y una casa a muy baja
// opacidad. Nunca recibe clics ni compite con el contenido. Se usa en la cabecera
// de /servicios y en la portada de la home. Con `animated` las piezas se mecen
// muy despacio (20-30 s por vuelta); quien pide menos movimiento lo ve quieto.
export function HeroBackdrop({ animated = false }: { animated?: boolean }) {
  const drift = (cls: string) => (animated ? `${cls} motion-reduce:animate-none` : '');
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute -top-48 -right-40 size-[34rem] rounded-full bg-[#FFF0E5] md:size-[46rem] ${drift('animate-[backdrop-drift_24s_ease-in-out_infinite]')}`} />
      <div className={`absolute -bottom-72 -left-56 size-[36rem] rounded-full border border-[#FFD3A1] ${drift('animate-[backdrop-breathe_20s_ease-in-out_infinite]')}`} />
      <div className={`absolute -bottom-60 -left-40 size-[28rem] rounded-full border border-[#FFE3C7] ${drift('animate-[backdrop-breathe_20s_ease-in-out_infinite] [animation-delay:-10s]')}`} />
      <svg viewBox="0 0 600 400" className={`absolute top-[8%] right-[6%] hidden w-[46rem] text-[#E67300] opacity-[0.06] xl:block ${drift('animate-[backdrop-drift_30s_ease-in-out_infinite] [animation-delay:-8s]')}`} fill="currentColor">
        <path d="M60 380V200L300 40l240 160v180H400V270H200v110Z" />
        <path d="M430 120V60h50v100Z" />
      </svg>
      <svg viewBox="0 0 800 300" className="absolute bottom-6 left-0 hidden w-[56rem] text-[#FFB877] xl:block" fill="none">
        <path d="M-20 280C180 140 360 300 560 170S820 60 860 40" stroke="currentColor" strokeWidth="1.5" opacity="0.6" />
      </svg>
      <div className={`absolute top-24 right-[38%] hidden h-28 w-36 opacity-60 xl:block ${drift('animate-soft-float')}`} style={DOTS} />
      <div className="absolute bottom-16 left-[44%] hidden h-24 w-28 opacity-50 xl:block" style={DOTS} />
      <span className="animate-soft-float absolute top-[22%] left-[47%] hidden size-3 rotate-45 rounded-[3px] border-2 border-[#FFB877] xl:block" />
      <span className="animate-soft-float absolute right-[4%] bottom-[18%] hidden size-2.5 rounded-full bg-[#FF8000]/70 [animation-delay:-2s] xl:block" />
    </div>
  );
}
