import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Building2, MapPin } from 'lucide-react';
import { AgencyResultRow } from '../../ui/AgencyCard';
import { AgencySearchBar, type SearchSuggestion } from '../../ui/AgencySearchBar';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { haversineKm } from '@/lib/geo';

// Antes había un selector de "distancia máxima" (10/25/50/100 km) que se quitó
// de la UI — sin él, mostrar TODAS las inmobiliarias con ubicación (solo
// reordenadas por cercanía, sin límite) hacía que una búsqueda en Madrid
// devolviera resultados a 350+ km. Mientras no vuelva ese selector, se aplica
// un radio fijo razonable para "tu zona".
const MAX_DISTANCE_KM = 50;

export function InmobiliariasResultsView({
  initialQuery,
  searchPoint,
  onSearch,
  onBack,
}: {
  initialQuery: string;
  searchPoint: { lat: number; lng: number };
  onSearch: (suggestion: SearchSuggestion) => void;
  onBack: () => void;
}) {
  const { agencies: allAgencies, isLive } = useInmobiliarias();

  // Esta vista filtra por lugar (distancia a un punto buscado) — las
  // inmobiliarias sin ubicación fijada no tienen cómo calcularse aquí, se
  // excluyen de este listado aunque sigan contando en el resto del sitio.
  const agencies = useMemo(
    () => allAgencies.filter((a) => a.lat != null && a.lng != null),
    [allAgencies],
  );

  const cityName = initialQuery.split(',')[0];

  const distances = useMemo(() => {
    const map = new Map<string, number>();
    for (const agency of agencies) {
      map.set(agency.id, haversineKm(searchPoint, { lat: agency.lat as number, lng: agency.lng as number }));
    }
    return map;
  }, [agencies, searchPoint]);

  const nearestId = useMemo(() => {
    let best: { id: string; km: number } | null = null;
    for (const [id, km] of distances) {
      if (!best || km < best.km) best = { id, km };
    }
    return best?.id ?? null;
  }, [distances]);

  const visibleAgencies = useMemo(
    () => agencies
      .filter((a) => (distances.get(a.id) ?? Infinity) <= MAX_DISTANCE_KM)
      .sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity)),
    [agencies, distances],
  );

  return (
    <div>
      {/* Hero — compacto, 220-260px. Sin overflow-hidden: el desplegable del
          buscador (absolute, z-40) se asoma por debajo de esta banda y no
          debe recortarse contra la sección siguiente. */}
      <div
        className="relative bg-black px-6 py-9"
        style={{
          backgroundImage: 'url(/assets/inmobiliarias/results-banner.png)',
          // >100% empuja el recorte más allá del borde derecho real de la imagen
          // (el negro de fondo rellena el hueco, se funde con el degradado).
          backgroundPosition: '130% center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/10 via-black/50 to-black/90"
        />
        <div className="relative mx-auto w-full max-w-[1400px]">
          <button
            type="button"
            onClick={onBack}
            className="mb-5 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white/80 backdrop-blur-md transition-all duration-200 hover:bg-white/20 hover:text-white active:scale-95"
          >
            <ArrowLeft size={14} /> Volver al directorio
          </button>
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">Directorio Cosiris</p>
          <h1 className="mt-2.5 text-[32px] font-black leading-[1.1] tracking-[-0.02em] text-white md:text-[36px]">
            Inmobiliarias en {cityName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/85">
            Compara agencias por experiencia, propiedades, ubicación y valoración.
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/75">
            <MapPin size={14} />
            <span>
              <strong className="font-bold text-white">{visibleAgencies.length}</strong> {visibleAgencies.length === 1 ? 'inmobiliaria encontrada' : 'inmobiliarias encontradas'}
            </span>
          </div>
          <div className="mt-5 max-w-xl">
            <AgencySearchBar initialValue={initialQuery} size="compact" onSelect={onSearch} placeholder="Cambiar de zona o buscar otra inmobiliaria" />
          </div>
        </div>
      </div>

      {/* Lista — el mapa se movió al perfil de cada inmobiliaria */}
      <main className="mx-auto w-full max-w-[960px] px-6 pb-16 pt-6">
        <div className="space-y-5">
          {visibleAgencies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
              <Building2 size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No hay inmobiliarias cerca de esta zona todavía</p>
              <p className="mt-1 text-sm text-slate-400">Prueba a buscar otra ciudad cercana.</p>
            </div>
          )}
          {visibleAgencies.map((agency, index) => (
            <motion.div
              key={agency.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.24) }}
            >
              <AgencyResultRow
                agency={agency}
                isNearest={agency.id === nearestId}
              />
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          {isLive
            ? 'Inmobiliarias reales, activas en el CRM Cosiris.'
            : 'Borrador con datos de ejemplo — todavía no hay inmobiliarias reales visibles en el directorio.'}
        </p>
      </main>
    </div>
  );
}
