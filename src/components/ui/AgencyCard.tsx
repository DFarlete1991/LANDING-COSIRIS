import { ArrowRight, BadgeCheck, Briefcase, Home, Languages, MapPin, Star, Wallet } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';

function formatPrice(price: number): string {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)}M€`;
  if (price >= 1000) return `${Math.round(price / 1000)}k€`;
  return `${price}€`;
}

function Avatar({ agency, size = 88 }: { agency: InmobiliariaPublica; size?: number }) {
  if (agency.foto_url) {
    return (
      <img
        src={agency.foto_url}
        alt={agency.nombre_agente}
        style={{ width: size, height: size, objectPosition: agency.foto_pos ?? '50% 50%' }}
        className="shrink-0 rounded-full border-2 border-white object-cover shadow-lg"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: agency.color_hex }}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white text-xl font-black text-white shadow-lg"
    >
      {agency.nombre_agente.slice(0, 1)}
    </div>
  );
}

function AgencyThumbnail({ agency, size }: { agency: InmobiliariaPublica; size: number }) {
  if (agency.logo_url) {
    return (
      <img
        src={agency.logo_url}
        alt={agency.nombre_comercial}
        style={{ width: size, height: size, objectPosition: agency.logo_pos ?? '50% 50%' }}
        className="shrink-0 rounded-full border-2 border-white object-cover shadow-sm"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, backgroundColor: agency.color_hex }}
      className="flex shrink-0 items-center justify-center rounded-full border-2 border-white text-[9px] font-black text-white shadow-sm"
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
      className="flex cursor-pointer gap-8 rounded-[24px] border border-slate-100 bg-white p-9 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-[transform,box-shadow] duration-[250ms] ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000]"
    >
      {/* Zona izquierda: Avatar */}
      <div className="relative shrink-0 self-start">
        <Avatar agency={agency} size={116} />
        {isNearest && (
          <span className="absolute -top-2 -left-2 rounded-full bg-[#0F172A]/90 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm">
            Cerca
          </span>
        )}
      </div>

      {/* Zona central: nombre → empresa → ubicación → métricas → especialidades, en ese orden fijo */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[32px] font-bold leading-[38px] text-[#1D2433]">{agency.nombre_agente}</p>
          <BadgeCheck size={19} className="shrink-0 text-[#FF8000]" aria-label="Cliente verificado" />
        </div>
        <p className="mt-2 text-[20px] font-medium text-[#1D2433]">{agency.nombre_comercial}</p>
        <p className="mt-2.5 flex items-center gap-1.5 text-[16px] text-[#6E7786]">
          <MapPin size={15} /> {agency.poblacion}, {agency.provincia}
        </p>

        {/* Métricas — mismo estilo gris para todas, sin arcoíris de colores */}
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          {agency.rating != null && (
            <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
              <Star size={14} className="fill-amber-400 text-amber-400" /> {agency.rating}
            </span>
          )}
          <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
            <Home size={14} className="text-[#6E7786]" /> {agency.num_propiedades} propiedades
          </span>
          {distanceKm != null && (
            <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
              <MapPin size={14} className="text-[#6E7786]" /> {formatDistanceKm(distanceKm)}
            </span>
          )}
          <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
            <Wallet size={14} className="text-[#6E7786]" /> {formatPrice(agency.precio_medio)}
          </span>
          <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
            <Briefcase size={14} className="text-[#6E7786]" /> {agency.anos_experiencia} años
          </span>
          {agency.idiomas[0] && (
            <span className="inline-flex h-[34px] items-center gap-1.5 rounded-full bg-[#F6F7F9] px-4 text-[13px] font-semibold text-[#1D2433]">
              <Languages size={14} className="text-[#6E7786]" /> {agency.idiomas[0]}
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

      {/* Derecha: Logo → Valoración → CTA, todo centrado verticalmente */}
      <div className="flex w-[132px] shrink-0 flex-col items-center gap-4 self-start">
        <AgencyThumbnail agency={agency} size={56} />
        {agency.rating != null && (
          <div className="text-center">
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
          className="flex h-[52px] w-full items-center justify-center gap-1.5 rounded-full bg-[#FF8000] text-[14px] font-bold text-white shadow-sm shadow-[#FF8000]/20 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[#E67300] hover:shadow-md hover:shadow-[#FF8000]/30 active:scale-95"
        >
          Ver perfil <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}
