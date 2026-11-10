// Va aparte para que el muro de vídeos lo pinte mientras descarga el resto.
export const AGENCY_VIDEO_GRID = 'grid grid-cols-2 gap-3 md:gap-5 lg:grid-cols-3 xl:grid-cols-4';

// Mientras cargan, tarjetas vacías con el mismo tamaño y un brillo que pasa:
// al llegar los vídeos no salta nada.
export function AgencyVideoSkeleton() {
  return (
    <ul aria-label="Cargando vídeos" className={`mt-3 md:mt-5 ${AGENCY_VIDEO_GRID}`}>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="overflow-hidden rounded-2xl bg-white shadow-[0_6px_20px_rgba(0,0,0,0.08)]">
          <span className="relative block aspect-video overflow-hidden bg-[#FFEBD8]">
            <span className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent motion-reduce:animate-none" />
          </span>
          <span className="block space-y-2 p-3 md:p-4">
            <span className="block h-3.5 w-3/4 rounded bg-neutral-200" />
            <span className="block h-3 w-1/2 rounded bg-neutral-100" />
          </span>
        </li>
      ))}
    </ul>
  );
}

