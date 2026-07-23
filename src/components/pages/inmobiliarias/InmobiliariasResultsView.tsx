import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, MapPin } from 'lucide-react';
import { AgencyResultRow } from '../../ui/AgencyCard';
import { FilterChips, type SortOption } from '../../ui/FilterChips';
import { INMOBILIARIAS_MOCK } from '@/data/inmobiliarias-mock';
import { haversineKm } from '@/lib/geo';

const NAVBAR_HEIGHT = 72;

export function InmobiliariasResultsView({
  initialQuery,
  searchPoint,
}: {
  initialQuery: string;
  searchPoint: { lat: number; lng: number };
}) {
  const [sort, setSort] = useState<SortOption>('distancia');
  const [maxDistanceKm, setMaxDistanceKm] = useState<number | null>(null);
  const [specialty, setSpecialty] = useState<string | null>(null);

  const cityName = initialQuery.split(',')[0];

  const specialtyOptions = useMemo(
    () => [...new Set(INMOBILIARIAS_MOCK.flatMap((a) => a.especialidades))].sort(),
    [],
  );

  const distances = useMemo(() => {
    const map = new Map<string, number>();
    for (const agency of INMOBILIARIAS_MOCK) {
      map.set(agency.id, haversineKm(searchPoint, { lat: agency.lat, lng: agency.lng }));
    }
    return map;
  }, [searchPoint]);

  const nearestId = useMemo(() => {
    let best: { id: string; km: number } | null = null;
    for (const [id, km] of distances) {
      if (!best || km < best.km) best = { id, km };
    }
    return best?.id ?? null;
  }, [distances]);

  const visibleAgencies = useMemo(() => {
    let list = INMOBILIARIAS_MOCK;
    if (maxDistanceKm != null) {
      list = list.filter((a) => (distances.get(a.id) ?? Infinity) <= maxDistanceKm);
    }
    if (specialty) {
      list = list.filter((a) => a.especialidades.includes(specialty));
    }
    list = [...list];
    if (sort === 'distancia') list.sort((a, b) => (distances.get(a.id) ?? Infinity) - (distances.get(b.id) ?? Infinity));
    else if (sort === 'experiencia') list.sort((a, b) => b.anos_experiencia - a.anos_experiencia);
    else if (sort === 'valoracion') list.sort((a, b) => b.rating - a.rating);
    else if (sort === 'propiedades') list.sort((a, b) => b.num_propiedades - a.num_propiedades);
    else list.sort((a, b) => a.nombre_comercial.localeCompare(b.nombre_comercial));
    return list;
  }, [sort, maxDistanceKm, specialty, distances]);

  return (
    <div>
      {/* Hero — compacto, 220-260px */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#12192B] to-[#1a2340] px-6 py-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] opacity-20 [background-size:26px_26px]"
        />
        <div className="relative mx-auto w-full max-w-[1400px]">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">Directorio Cosiris</p>
          <h1 className="mt-2.5 text-[32px] font-black leading-[1.1] tracking-[-0.02em] text-white md:text-[36px]">
            Inmobiliarias en {cityName}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Compara agencias por experiencia, propiedades, ubicación y valoración.
          </p>
          <div className="mt-3 flex items-center gap-2 text-sm text-white/60">
            <MapPin size={14} />
            <span>
              <strong className="font-bold text-white">{visibleAgencies.length}</strong> {visibleAgencies.length === 1 ? 'inmobiliaria encontrada' : 'inmobiliarias encontradas'}
            </span>
          </div>
        </div>
      </div>

      {/* Filtros — sticky justo debajo del navbar */}
      <div
        className="z-30 border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-sm"
        style={{ position: 'sticky', top: NAVBAR_HEIGHT }}
      >
        <div className="mx-auto w-full max-w-[1400px]">
          <FilterChips
            sort={sort}
            onSortChange={setSort}
            maxDistanceKm={maxDistanceKm}
            onMaxDistanceChange={setMaxDistanceKm}
            specialties={specialtyOptions}
            selectedSpecialty={specialty}
            onSpecialtyChange={setSpecialty}
          />
        </div>
      </div>

      {/* Lista — el mapa se movió al perfil de cada inmobiliaria */}
      <main className="mx-auto w-full max-w-[960px] px-6 pb-16 pt-6">
        <div className="space-y-5">
          {visibleAgencies.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E6E8EC] bg-white p-10 text-center shadow-sm">
              <Building2 size={36} className="mx-auto text-slate-300" />
              <p className="mt-3 font-semibold text-slate-700">No hay inmobiliarias en este rango</p>
              <p className="mt-1 text-sm text-[#6E7786]">Prueba a ampliar la distancia máxima de búsqueda.</p>
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
                distanceKm={distances.get(agency.id) ?? null}
                isNearest={agency.id === nearestId}
                searchPoint={searchPoint}
              />
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-slate-400">
          Borrador con datos de ejemplo — el directorio real se conectará a las inmobiliarias activas del CRM Cosiris.
        </p>
      </main>
    </div>
  );
}
