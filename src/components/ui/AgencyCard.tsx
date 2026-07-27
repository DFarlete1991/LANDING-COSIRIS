import { ArrowRight, BadgeCheck, Briefcase, Home, Languages, MapPin, Star, Wallet } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M€`;
  if (price >= 1000) return `${Math.round(price / 1000)}k€`;
  return `${price}€`;
}

function Avatar({ agency, sizeClass = 'h-[88px] w-[88px]' }: { agency: InmobiliariaPublica; sizeClass?: string }) {
  if (agency.foto_url) {
    return (
      <img
        src={agency.foto_url}
        alt={agency.nombre_agente}
        style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
        className={`shrink-0 rounded-full border-2 border-white object-cover shadow-lg ${sizeClass}`}
      />
    );
  }
  return (
    <div
      style={{ backgroundColor: agency.color_hex }}
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-white text-xl font-black text-white shadow-lg ${sizeClass}`}
    >
      {agency.nombre_agente.slice(0, 1)}
    </div>
  );
}

function AgencyThumbnail({ agency, sizeClass }: { agency: InmobiliariaPublica; sizeClass: string }) {
  if (agency.logo_url) {
    return (
      <img
        src={agency.logo_url}
        alt={agency.nombre_comercial}
        style={{ objectPosition: agency.logo_pos ?? '50% 50%' }}
        className={`shrink-0 rounded-full border-2 border-white object-cover shadow-sm ${sizeClass}`}
      />
    );
  }
  return (
    <div
      style={{ backgroundColor: agency.color_hex }}
      className={`shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-black text-white shadow-sm ${sizeClass}`}
    >
      {agency.nombre_comercial.slice(0, 1)}
    </div>
  );
}

export function AgencyCard({
  agency,
  distanceKm,
  isNearest,
}: {
  agency: InmobiliariaPublica;
  distanceKm?: number | null;
  isNearest?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => navigateTo(`/inmobiliarias/${agency.id}`)}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm shadow-slate-900/5 transition-[transform,border-color,box-shadow] duration-300 ease-out hover:-translate-y-1.5 hover:border-[#FF8000]/20 hover:shadow-xl hover:shadow-[#FF8000]/10"
    >
      <div
        className="relative h-36 w-full shrink-0 overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${agency.color_hex} 0%, #0F172A 140%)` }}
      >
        {agency.banner_url && (
          <img src={agency.banner_url} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        {isNearest && (
          <span className="absolute left-3 top-3 rounded-full bg-[#0F172A]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] text-white shadow-sm backdrop-blur-sm">
            Más cercana
          </span>
        )}
        {agency.logo_url ? (
          <img
            src={agency.logo_url}
            alt={agency.nombre_comercial}
            style={{ objectPosition: agency.logo_pos ?? '50% 50%' }}
            className="absolute -bottom-4 left-4 h-10 w-10 rounded-full border-2 border-white object-cover shadow-lg shadow-slate-900/20 transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div
            className="absolute -bottom-4 left-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-white text-xs font-black text-white shadow-lg shadow-slate-900/20 transition-transform duration-300 group-hover:scale-110"
            style={{ backgroundColor: agency.color_hex }}
          >
            {agency.nombre_comercial.slice(0, 1)}
          </div>
        )}
      </div>

      <div className="flex-1 px-4 pb-4 pt-6">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-bold text-slate-900">{agency.nombre_comercial}</p>
          <BadgeCheck size={15} className="mt-0.5 shrink-0 text-[#FF8000]" aria-label="Cliente verificado de Cosiris" />
        </div>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
          <MapPin size={11} /> {agency.poblacion}, {agency.provincia}
        </p>
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600">{agency.texto_presentacion}</p>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Briefcase size={11} /> {agency.anos_experiencia} años</span>
          {distanceKm != null && <span className="font-bold text-[#FF8000]">{formatDistanceKm(distanceKm)}</span>}
        </div>
      </div>
    </button>
  );
}

export function AgencyResultRow({
  agency,
  distanceKm,
  isNearest,
  searchPoint,
}: {
  agency: InmobiliariaPublica;
  distanceKm: number | null;
  isNearest: boolean;
  searchPoint?: { lat: number; lng: number } | null;
}) {
  const goToProfile = () => {
    const href = searchPoint
      ? `/inmobiliarias/${agency.id}?lat=${searchPoint.lat}&lng=${searchPoint.lng}`
      : `/inmobiliarias/${agency.id}`;
    navigateTo(href);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          goToProfile();
        }
      }}
      className="flex cursor-pointer flex-col gap-4 rounded-[24px] border border-slate-100 bg-white p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] duration-[250ms] ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000] sm:gap-8 sm:p-9"
    >
      {/* En móvil: avatar + nombre lado a lado. En sm+: display:contents hace que
          este wrapper "desaparezca" y avatar/central vuelvan a ser columnas
          independientes del flex-row original. */}
      <div className="flex gap-3 sm:contents">
        {/* Zona izquierda: Avatar */}
        <div className="relative shrink-0 self-start">
          <Avatar agency={agency} sizeClass="h-16 w-16 sm:h-[116px] sm:w-[116px]" />
          {isNearest && (
            <span className="absolute -top-2 -left-2 rounded-full bg-[#0F172A]/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[9px]">
              Cerca
            </span>
          )}
        </div>

        {/* Zona central: nombre → empresa → ubicación → métricas → especialidades, en ese orden fijo */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <p className="truncate text-base font-bold leading-tight text-[#1D2433] sm:text-[32px] sm:leading-[38px]">{agency.nombre_agente}</p>
            <BadgeCheck size={16} className="shrink-0 text-[#FF8000] sm:hidden" aria-label="Cliente verificado" />
            <BadgeCheck size={19} className="hidden shrink-0 text-[#FF8000] sm:block" aria-label="Cliente verificado" />
          </div>
          <p className="mt-1 truncate text-sm font-medium text-[#1D2433] sm:mt-2 sm:text-[20px]">{agency.nombre_comercial}</p>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#6E7786] sm:mt-2.5 sm:text-[16px]">
            <MapPin size={13} className="shrink-0 sm:hidden" />
            <MapPin size={15} className="hidden shrink-0 sm:block" />
            {agency.poblacion}, {agency.provincia}
          </p>

          {/* Métricas — mismo estilo gris para todas, sin arcoíris de colores */}
          <div className="mt-3 flex flex-wrap items-center gap-2 sm:mt-4 sm:gap-2.5">
            {agency.rating != null && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
                <Star size={13} className="fill-amber-400 text-amber-400" /> {agency.rating}
              </span>
            )}
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
              <Home size={13} className="text-[#6E7786]" /> {agency.num_propiedades} propiedades
            </span>
            {distanceKm != null && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
                <MapPin size={13} className="text-[#6E7786]" /> {formatDistanceKm(distanceKm)}
              </span>
            )}
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
              <Wallet size={13} className="text-[#6E7786]" /> {formatPrice(agency.precio_medio)}
            </span>
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
              <Briefcase size={13} className="text-[#6E7786]" /> {agency.anos_experiencia} años
            </span>
            {agency.idiomas[0] && (
              <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#F6F7F9] px-3 text-xs font-semibold text-[#1D2433] sm:h-[34px] sm:px-4 sm:text-[13px]">
                <Languages size={13} className="text-[#6E7786]" /> {agency.idiomas[0]}
              </span>
            )}
          </div>

          {/* Especialidades — máximo 4 visibles */}
          <div className="mt-3 flex flex-wrap gap-2">
            {agency.especialidades.slice(0, 4).map((esp) => (
              <span key={esp} className="rounded-md bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-[#6E7786]">
                {esp}
              </span>
            ))}
            {agency.especialidades.length > 4 && (
              <span className="rounded-md bg-slate-50 px-2.5 py-1 text-[12px] font-medium text-[#6E7786]">
                +{agency.especialidades.length - 4}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Derecha: en móvil, fila horizontal completa abajo; en sm+, columna a la derecha */}
      <div className="flex shrink-0 items-center gap-3 sm:w-[132px] sm:flex-col sm:items-center sm:gap-4 sm:self-start">
        <AgencyThumbnail agency={agency} sizeClass="hidden h-14 w-14 sm:flex" />
        {agency.rating != null && (
          <div className="hidden text-center sm:block">
            <p className="flex items-center justify-center gap-1 text-[15px] font-bold text-[#1D2433]">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {agency.rating}
            </p>
            {agency.num_opiniones != null && (
              <p className="text-[11px] text-[#6E7786]">{agency.num_opiniones} opiniones</p>
            )}
          </div>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); goToProfile(); }}
          className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#FF8000] text-sm font-bold text-white shadow-sm shadow-[#FF8000]/20 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[#E67300] hover:shadow-md hover:shadow-[#FF8000]/30 active:scale-95 sm:h-[52px] sm:w-full sm:text-[14px]"
        >
          Ver perfil <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
