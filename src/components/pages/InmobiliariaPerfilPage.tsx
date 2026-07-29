import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, BadgeCheck, ChevronDown, ChevronRight, Globe, MapPin, Phone, Users, Briefcase, X } from 'lucide-react';
import { Footer } from '../Footer';
import { AgencyLeadForm } from '../ui/AgencyLeadForm';
import { PlaceholderImage } from '../ui/PlaceholderImage';
import { AgencyMap } from '../ui/AgencyMap';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { haversineKm, formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';

function LocationSection({ agency, searchPoint }: { agency: InmobiliariaPublica; searchPoint: { lat: number; lng: number } | null }) {
  // Sin coordenadas fijadas no hay nada que pintar en el mapa ni "cómo
  // llegar" que calcular — se oculta la sección entera en vez de romper.
  if (agency.lat == null || agency.lng == null) return null;

  const location = { lat: agency.lat, lng: agency.lng };
  const distanceKm = searchPoint ? haversineKm(searchPoint, location) : null;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Ubicación</h2>
        {distanceKm != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#F6F7F9] px-3 py-1 text-xs font-bold text-[#1D2433]">
            <MapPin size={12} className="text-[#6E7786]" /> A {formatDistanceKm(distanceKm)} de tu búsqueda
          </span>
        )}
      </div>
      <div className="h-64 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <AgencyMap
          agencies={[agency]}
          searchPoint={searchPoint}
          center={[location.lat, location.lng]}
          zoom={14}
        />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {agency.direccion}, {agency.poblacion} ({agency.cp})
        </p>
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#FF8000] px-4 py-2 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#E67300] hover:shadow-md active:scale-95"
        >
          <MapPin size={13} /> Cómo llegar
        </a>
      </div>
    </div>
  );
}

function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="flex flex-wrap items-center gap-1 text-xs text-slate-500">
      {items.map((item, index) => (
        <span key={item.label} className="flex items-center gap-1">
          {index > 0 && <ChevronRight size={12} className="text-slate-300" />}
          {item.href ? (
            <button type="button" onClick={() => navigateTo(item.href!)} className="transition-colors hover:text-[#FF8000]">
              {item.label}
            </button>
          ) : (
            <span className="font-medium text-slate-700">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

const FAQ = [
  { q: '¿Cuánto vale realmente mi casa?', a: 'No existe un precio único. Analizamos ventas recientes, datos oficiales y herramientas profesionales para ofrecerte una valoración realista con una horquilla de tres precios: venta rápida, precio recomendado y precio máximo de mercado.' },
  { q: '¿Infláis el precio para captar la propiedad?', a: 'No. Trabajamos con datos reales y experiencia de mercado. Una valoración ajustada aumenta las posibilidades de vender antes y en mejores condiciones.' },
  { q: '¿Cobráis por valorar la vivienda?', a: 'No. La valoración es gratuita y sin compromiso. Es el primer paso para asesorarte correctamente antes de poner tu vivienda a la venta.' },
  { q: '¿Cuánto se tarda en vender una vivienda?', a: 'Depende del mercado y, sobre todo, del precio de salida. Cuanto más ajustado esté a la realidad, más opciones habrá de vender en menos tiempo.' },
  { q: '¿Cuánto cobráis por vender una propiedad?', a: 'Los honorarios dependen de cada operación. Te explicaremos las condiciones de forma transparente durante la visita, sin compromiso.' },
  { q: '¿Tenéis que venir a mi casa para valorarla?', a: 'Sí, siempre que sea posible. Hay muchos aspectos que solo pueden valorarse en persona, como el estado de la vivienda, las reformas, la orientación, la luminosidad o los acabados.' },
  { q: '¿Por qué debería confiar en vosotros?', a: 'Porque combinamos experiencia, marketing y tecnología para dar la máxima visibilidad a tu vivienda y ayudarte a vender al mejor precio posible.' },
  { q: '¿Tengo que firmar una exclusiva?', a: 'No siempre. Analizaremos tu caso y te recomendaremos la opción que mejor se adapte a tus objetivos.' },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 transition-colors hover:border-slate-300">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50"
      >
        {question}
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
            className="overflow-hidden"
          >
            <p className="border-t border-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-600">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RevealPhone({ agency }: { agency: InmobiliariaPublica }) {
  const [revealed, setRevealed] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!showModal) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowModal(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showModal]);

  if (revealed) {
    return (
      <a href={`tel:${agency.telefono}`} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-200">
        <Phone size={14} className="text-green-600" /> {agency.telefono}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={{ backgroundColor: agency.color_hex }}
        className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
      >
        <Phone size={14} /> Mostrar teléfono
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
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Antes de ver el teléfono</p>
                  <h3 className="mb-5 text-lg font-extrabold text-slate-900">Cuéntale a {agency.nombre_comercial} qué necesitas</h3>
                  <AgencyLeadForm agency={agency} onSuccess={() => { setRevealed(true); setShowModal(false); }} />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}

export function InmobiliariaPerfilPage({ id }: { id: string }) {
  const { agencies } = useInmobiliarias();
  const agency = agencies.find((a) => a.id === id);

  // Si se llegó desde una búsqueda (lista de resultados), conserva el punto
  // buscado para poder mostrar distancia real en el mapa del perfil.
  const searchPoint = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    return lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
  }, []);

  /** Vuelve a los resultados de búsqueda si venía de ahí, o al home si no. */
  const backUrl = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const lat = params.get('lat');
    const lng = params.get('lng');
    if (q && lat && lng) return `/inmobiliarias?${params.toString()}`;
    return '/inmobiliarias';
  }, []);

  if (!agency) {
    return (
      <div className="flex min-h-screen flex-col">
        <main className="mx-auto flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="text-lg font-bold text-slate-900">No encontramos esta inmobiliaria</p>
          <button
            type="button"
            onClick={() => navigateTo('/inmobiliarias')}
            className="mt-4 text-sm font-semibold text-[#FF8000] hover:underline"
          >
            ← Volver al directorio
          </button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased">
      <div
        className="relative h-48 w-full overflow-hidden md:h-64"
        style={agency.banner_url ? undefined : { background: `linear-gradient(135deg, ${agency.color_hex} 0%, #0F172A 140%)` }}
      >
        <button
          type="button"
          onClick={() => navigateTo(backUrl)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-white/90 px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-lg shadow-black/10 backdrop-blur-sm transition-all hover:bg-white hover:text-slate-900 active:scale-95"
          aria-label="Volver a resultados"
        >
          <ArrowLeft size={16} />
          Volver
        </button>
        {agency.banner_url ? (
          <>
            <img src={agency.banner_url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/10" />
          </>
        ) : (
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        )}
      </div>

      <main className="mx-auto w-full max-w-5xl px-4 pb-20">
        <div className="-mt-14 mb-4 md:-mt-16">
          <div className="relative inline-block">
            {agency.foto_url ? (
              <img
                src={agency.foto_url}
                alt={agency.nombre_agente}
                style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white object-cover shadow-xl md:h-28 md:w-28"
              />
            ) : (
              <PlaceholderImage
                icon="person"
                label="Foto pendiente"
                className="h-24 w-24 shrink-0 rounded-full border-4 border-white shadow-xl md:h-28 md:w-28"
              />
            )}
            {agency.logo_url ? (
              <img
                src={agency.logo_url}
                alt={agency.nombre_comercial}
                style={{ objectPosition: agency.logo_pos ?? '50% 50%' }}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full border-2 border-white object-cover shadow-lg md:h-10 md:w-10"
              />
            ) : (
              <div
                className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white text-xs font-black text-white shadow-lg md:h-10 md:w-10"
                style={{ backgroundColor: agency.color_hex }}
              >
                {agency.nombre_comercial.slice(0, 1)}
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <button
            type="button"
            onClick={() => navigateTo('/inmobiliarias')}
            className="group flex items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-[#FF8000]"
          >
            <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
            Volver al directorio
          </button>
        </div>

        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Inmobiliarias', href: '/inmobiliarias' },
            { label: agency.provincia },
            { label: agency.nombre_comercial },
          ]}
        />

        <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr]">
          <div className="space-y-6">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-black tracking-[-0.02em] text-[#0F172A] md:text-3xl">
                {agency.nombre_comercial}
                <BadgeCheck size={20} className="shrink-0 text-[#FF8000]" aria-label="Cliente verificado de Cosiris" />
              </h1>
              <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
                <MapPin size={14} className="shrink-0" /> {agency.direccion}, {agency.poblacion} ({agency.cp})
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                <Briefcase size={12} className="text-[#FF8000]" /> {agency.anos_experiencia} años en el negocio
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm">
                <Users size={12} className="text-[#FF8000]" /> {agency.num_empleados} empleados
              </span>
              {agency.pagina_web && (
                <a
                  href={agency.pagina_web}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-[#FF8000]/50 hover:bg-[#FFF4EC] hover:text-[#FF8000]"
                >
                  <Globe size={12} /> {agency.pagina_web.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            <RevealPhone agency={agency} />

            <div className="border-t border-slate-100 pt-7">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Sobre nosotros</h2>
              <p className="text-sm leading-relaxed text-slate-700">{agency.texto_presentacion}</p>
            </div>

            {agency.media_presentacion_url && (
              <div className="border-t border-slate-100 pt-7">
                <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Video de presentación</h2>
                <video controls className="aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-black shadow-sm" src={agency.media_presentacion_url} />
              </div>
            )}

            {agency.lat != null && agency.lng != null && (
              <div className="border-t border-slate-100 pt-7">
                <LocationSection agency={agency} searchPoint={searchPoint} />
              </div>
            )}

            <div className="border-t border-slate-100 pt-7">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Preguntas frecuentes</h2>
              <div className="space-y-2">
                {FAQ.map((item) => (
                  <FaqItem key={item.q} question={item.q} answer={item.a} />
                ))}
              </div>
            </div>
          </div>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="relative shrink-0">
                  {agency.foto_url ? (
                    <img
                      src={agency.foto_url}
                      alt={agency.nombre_agente}
                      style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
                      className="h-12 w-12 rounded-full object-cover"
                    />
                  ) : (
                    <PlaceholderImage icon="person" className="h-12 w-12 rounded-full" />
                  )}
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.nombre_comercial}
                      style={{ objectPosition: agency.logo_pos ?? '50% 50%' }}
                      className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-2 border-white object-cover shadow-sm"
                    />
                  ) : (
                    <div
                      className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border-2 border-white text-[9px] font-black text-white shadow-sm"
                      style={{ backgroundColor: agency.color_hex }}
                    >
                      {agency.nombre_comercial.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">Contactar con</p>
                  <p className="text-sm font-bold text-slate-900">{agency.nombre_comercial}</p>
                </div>
              </div>
              <AgencyLeadForm agency={agency} />
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
