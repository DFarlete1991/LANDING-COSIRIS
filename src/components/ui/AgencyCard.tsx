import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Briefcase, Check, Clock, Home, MapPin, Phone, Star, Users, X } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';
import { AgencyLeadForm } from './AgencyLeadForm';

function Avatar({ agency, sizeClass = 'h-[88px] w-[88px]' }: { agency: InmobiliariaPublica; sizeClass?: string }) {
  // Primero la foto de perfil; si no hay, el logo; y si tampoco, la inicial.
  const image = agency.foto_url ?? agency.logo_url;
  if (image) {
    return (
      <img
        src={image}
        alt={agency.foto_url ? agency.nombre_agente : agency.nombre_comercial}
        style={{ objectPosition: agency.foto_pos ?? agency.logo_pos ?? '50% 50%' }}
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
  // Mini-identificador de marca debajo del avatar: siempre el logo de la
  // inmobiliaria (nunca la foto de perfil, que ya va arriba); si no hay
  // logo, iniciales sobre el color de la marca.
  const image = agency.logo_url;
  if (image) {
    return (
      <img
        src={image}
        alt={agency.nombre_comercial}
        style={{ objectPosition: agency.foto_pos ?? agency.logo_pos ?? '50% 50%' }}
        className={`shrink-0 border-2 border-white object-cover shadow-sm ${sizeClass}`}
      />
    );
  }
  return (
    <div
      style={{ backgroundColor: agency.color_hex }}
      className={`inline-flex shrink-0 items-center justify-center border-2 border-white font-black text-white shadow-sm ${sizeClass}`}
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
        {agency.foto_url ? (
          <img
            src={agency.foto_url}
            alt={agency.nombre_agente}
            style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
            className="absolute -bottom-4 left-4 h-10 w-10 rounded-full border-[3px] border-white object-cover shadow-lg shadow-slate-900/20 transition-transform duration-300 group-hover:scale-110"
          />
        ) : agency.logo_url ? (
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
  isNearest,
  searchPoint,
  selectable = false,
  selected = false,
  onToggle,
}: {
  agency: InmobiliariaPublica;
  isNearest: boolean;
  searchPoint?: { lat: number; lng: number } | null;
  selectable?: boolean;
  selected?: boolean;
  onToggle?: (id: string) => void;
}) {
  const [showPhone, setShowPhone] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  const goToProfile = () => {
    const href = searchPoint
      ? `/inmobiliarias/${agency.id}?lat=${searchPoint.lat}&lng=${searchPoint.lng}`
      : `/inmobiliarias/${agency.id}`;
    navigateTo(href);
  };

  const handleActivate = () => {
    if (selectable && onToggle) onToggle(agency.id);
    else goToProfile();
  };

  const filledStars = agency.rating != null ? Math.round(agency.rating) : 0;

  // Una métrica en 0 no aporta nada y se ve como un dato roto — se omite en
  // vez de mostrar "0 Propiedades" / "0 años" / "0 Agentes".
  const metrics = [
    agency.num_propiedades > 0 && { icon: Home, value: String(agency.num_propiedades), label: 'Propiedades' },
    agency.anos_experiencia > 0 && { icon: Clock, value: `${agency.anos_experiencia} años`, label: 'Experiencia' },
    agency.num_empleados > 0 && { icon: Users, value: String(agency.num_empleados), label: 'Agentes' },
  ].filter((m): m is { icon: typeof Home; value: string; label: string } => Boolean(m));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleActivate();
        }
      }}
      className={`flex cursor-pointer flex-col gap-4 rounded-[24px] border p-4 shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-[transform,border-color,box-shadow] duration-[250ms] ease-out hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(15,23,42,0.1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000] sm:flex-row sm:gap-6 sm:p-6 ${
        selected ? 'border-[#FF8000] bg-orange-50/40 ring-2 ring-[#FF8000]/20' : 'border-slate-100 bg-white'
      }`}
    >
      {/* En móvil: avatar + nombre lado a lado. En sm+: display:contents hace que
          este wrapper "desaparezca" y avatar/central vuelvan a ser columnas
          independientes del flex-row original. */}
      <div className="flex gap-3 sm:contents">
        {/* Zona izquierda: foto del asesor + logo pequeño de la inmobiliaria debajo */}
        <div className="relative flex shrink-0 flex-col items-start gap-2.5 self-start sm:items-center">
          <Avatar agency={agency} sizeClass="h-16 w-16 sm:h-[92px] sm:w-[92px]" />
          {isNearest && (
            <span className="absolute -top-2 -left-2 rounded-full bg-[#0F172A]/90 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.08em] text-white shadow-sm backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[9px]">
              Cerca
            </span>
          )}
          <div className="hidden items-center gap-1.5 sm:flex">
            {agency.foto_url && <AgencyThumbnail agency={agency} sizeClass="h-6 w-6 rounded-md" />}
            <span className="max-w-[90px] truncate text-[10px] font-black uppercase leading-tight tracking-tight text-slate-400">
              {agency.nombre_comercial}
            </span>
          </div>
        </div>

        {/* Zona central: nombre → verificada → ubicación → valoración → descripción → métricas */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <p className="truncate text-base font-bold leading-tight text-slate-900 sm:text-[26px] sm:leading-[32px]">{agency.nombre_agente}</p>
            <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-[#FF8000] sm:text-[13px]">
              <BadgeCheck size={16} className="shrink-0" /> Verificada
            </span>
          </div>
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500 sm:text-sm">
            <MapPin size={13} className="shrink-0 text-slate-400" />
            {agency.poblacion}, {agency.provincia}
          </p>

          {agency.rating != null && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={13}
                    className={i < filledStars ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-900 sm:text-sm">{agency.rating}</span>
              {agency.num_opiniones != null && (
                <span className="text-xs text-slate-400 sm:text-sm">({agency.num_opiniones} reseñas)</span>
              )}
            </div>
          )}

          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">{agency.texto_presentacion}</p>
          {agency.texto_presentacion.length > 110 && (
            <span className="mt-0.5 inline-block text-xs font-bold text-[#FF8000] sm:text-sm">Leer más</span>
          )}

          <div className="mt-3.5 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-100 pt-3.5 sm:mt-4 sm:pt-4">
            {metrics.map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center gap-2">
                <Icon size={16} className="shrink-0 text-[#FF8000]" />
                <div className="leading-tight">
                  <p className="text-sm font-bold text-slate-900">{value}</p>
                  <p className="text-[11px] text-slate-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Derecha: acciones — solo desktop */}
      <div className="hidden shrink-0 flex-col items-stretch gap-2 self-center sm:flex sm:w-[160px]">
        {selectable ? (
          <div className="flex flex-col items-center gap-2">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                selected ? 'border-[#FF8000] bg-[#FF8000]' : 'border-slate-300 bg-white'
              }`}
            >
              {selected && <Check size={22} strokeWidth={2.5} className="text-white" />}
            </span>
            <span className={`text-[13px] font-bold ${selected ? 'text-[#FF8000]' : 'text-slate-500'}`}>
              {selected ? 'Seleccionada' : 'Seleccionar'}
            </span>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); goToProfile(); }}
              className="flex h-[48px] w-full items-center justify-center gap-1.5 rounded-full bg-[#FF8000] text-[14px] font-bold text-white shadow-sm shadow-[#FF8000]/20 transition-[background-color,box-shadow,transform] duration-200 ease-out hover:bg-[#E67300] hover:shadow-md hover:shadow-[#FF8000]/30 active:scale-95"
            >
              Ver perfil <ArrowRight size={15} />
            </button>
            {showPhone ? (
              <a
                href={`tel:${agency.telefono}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center justify-center gap-1.5 py-1 text-center text-[13px] font-bold text-green-700 underline decoration-green-300 underline-offset-2 transition-colors hover:text-green-800 hover:decoration-green-500"
              >
                <Phone size={12} /> {agency.telefono}
              </a>
            ) : (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
                className="flex cursor-pointer items-center justify-center gap-1.5 py-1 text-center text-[13px] font-semibold text-slate-500 underline decoration-slate-300 underline-offset-2 transition-colors hover:text-[#FF8000] hover:decoration-[#FF8000]"
              >
                <Phone size={12} /> Ver teléfono
              </button>
            )}
          </>
        )}
      </div>
      {/* En móvil: botón compacto */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); handleActivate(); }}
        className={`flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-bold shadow-sm transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out active:scale-95 sm:hidden ${
          selectable
            ? selected
              ? 'bg-[#FF8000] text-white'
              : 'border border-slate-200 bg-white text-slate-600'
            : 'bg-[#FF8000] text-white shadow-[#FF8000]/20 hover:bg-[#E67300] hover:shadow-md hover:shadow-[#FF8000]/30'
        }`}
      >
        {selectable ? (
          selected ? (<><Check size={16} /> Elegida</>) : 'Elegir'
        ) : (
          <>Ver perfil <ArrowRight size={15} /></>
        )}
      </button>

      {createPortal(
        <AnimatePresence>
          {showModal && (
            <>
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
                aria-hidden="true"
              />
              <motion.div
                key="panel"
                role="dialog"
                aria-modal
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.97 }}
                transition={{ duration: 0.3, ease: [0.19, 1, 0.22, 1] }}
                onClick={() => setShowModal(false)}
                className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
              >
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-black/20"
                >
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    aria-label="Cerrar"
                    className="absolute right-4 top-4 z-10 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                  >
                    <X size={18} />
                  </button>
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Sin compromiso</p>
                  <h3 className="mb-5 text-lg font-extrabold text-slate-900">
                    Cuéntale a {agency.nombre_comercial} qué necesitas
                  </h3>
                  <AgencyLeadForm
                    agency={agency}
                    onSuccess={() => { setShowPhone(true); setShowModal(false); }}
                  />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
