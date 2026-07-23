import { useMemo, useState } from 'react';
import { ArrowLeft, BadgeCheck, ChevronRight, Globe, MapPin, Phone, PlayCircle, Users, Briefcase } from 'lucide-react';
import { Footer } from '../Footer';
import { AgencyLeadForm } from '../ui/AgencyLeadForm';
import { PlaceholderImage } from '../ui/PlaceholderImage';
import { AgencyMap } from '../ui/AgencyMap';
import { InmobiliariasNavbar } from './inmobiliarias/InmobiliariasNavbar';
import { INMOBILIARIAS_MOCK, type InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { haversineKm, formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';

function VideoSection({ agency }: { agency: InmobiliariaPublica }) {
  if (agency.media_presentacion_url) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <video controls className="aspect-video w-full bg-black" src={agency.media_presentacion_url} />
      </div>
    );
  }
  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-[#F6F7F9] text-slate-400">
      <PlayCircle size={36} strokeWidth={1.5} />
      <span className="text-xs font-semibold uppercase tracking-wide">Video pendiente</span>
    </div>
  );
}

function LocationSection({ agency, searchPoint }: { agency: InmobiliariaPublica; searchPoint: { lat: number; lng: number } | null }) {
  const distanceKm = searchPoint ? haversineKm(searchPoint, { lat: agency.lat, lng: agency.lng }) : null;

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
          nearestId={null}
          searchPoint={searchPoint}
          center={[agency.lat, agency.lng]}
          zoom={14}
          onSelect={() => {}}
        />
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

function RevealPhone({ telefono, colorHex }: { telefono: string; colorHex: string }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) {
    return (
      <a href={`tel:${telefono}`} className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-slate-200">
        <Phone size={14} className="text-green-600" /> {telefono}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      style={{ backgroundColor: colorHex }}
      className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-md shadow-black/10 transition-all duration-200 hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
    >
      <Phone size={14} /> Mostrar teléfono
    </button>
  );
}

export function InmobiliariaPerfilPage({ id }: { id: string }) {
  const agency = INMOBILIARIAS_MOCK.find((a) => a.id === id);

  // Si se llegó desde una búsqueda (lista de resultados), conserva el punto
  // buscado para poder mostrar distancia real en el mapa del perfil.
  const searchPoint = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    return lat && lng ? { lat: Number(lat), lng: Number(lng) } : null;
  }, []);

  if (!agency) {
    return (
      <div className="flex min-h-screen flex-col">
        <InmobiliariasNavbar />
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
      <InmobiliariasNavbar />

      <div
        className="relative h-48 w-full overflow-hidden md:h-64"
        style={agency.banner_url ? undefined : { background: `linear-gradient(135deg, ${agency.color_hex} 0%, #0F172A 140%)` }}
      >
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
            <PlaceholderImage
              icon="person"
              label="Foto pendiente"
              className="h-24 w-24 shrink-0 rounded-2xl border-4 border-white shadow-xl md:h-28 md:w-28"
            />
            <div
              className="absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border-2 border-white text-xs font-black text-white shadow-lg md:h-10 md:w-10"
              style={{ backgroundColor: agency.color_hex }}
            >
              {agency.nombre_comercial.slice(0, 1)}
            </div>
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

            <RevealPhone telefono={agency.telefono} colorHex={agency.color_hex} />

            <div className="border-t border-slate-100 pt-7">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Sobre nosotros</h2>
              <p className="text-sm leading-relaxed text-slate-700">{agency.texto_presentacion}</p>
            </div>

            <div className="border-t border-slate-100 pt-7">
              <h2 className="mb-3 text-sm font-bold uppercase tracking-[0.14em] text-slate-500">Video de presentación</h2>
              <VideoSection agency={agency} />
            </div>

            <div className="border-t border-slate-100 pt-7">
              <LocationSection agency={agency} searchPoint={searchPoint} />
            </div>
          </div>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5">
              <div className="mb-5 flex items-center gap-3">
                <div className="relative shrink-0">
                  <PlaceholderImage icon="person" className="h-12 w-12 rounded-full" />
                  <div
                    className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-md border-2 border-white text-[9px] font-black text-white shadow-sm"
                    style={{ backgroundColor: agency.color_hex }}
                  >
                    {agency.nombre_comercial.slice(0, 1)}
                  </div>
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
