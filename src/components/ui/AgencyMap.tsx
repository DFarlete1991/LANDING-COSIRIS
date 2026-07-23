import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Briefcase, MapPin } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { haversineKm, formatDistanceKm } from '@/lib/geo';
import { navigateTo } from '@/lib/utils';

const DOT = (size: number, color: string, borderWidth = 2) =>
  L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${borderWidth}px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);transition:transform 150ms"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

const ICONS = {
  default: DOT(14, '#9CA3AF'),
  defaultNearest: DOT(16, '#9CA3AF', 3),
  hover: DOT(20, '#FF8000'),
  selected: DOT(24, '#C2410C', 3),
  search: DOT(14, '#2563EB'),
};

const DOUBLE_CLICK_WINDOW_MS = 280;

// El mapa solo se recentra cuando cambia la búsqueda (nueva ciudad). No hay
// pan/zoom automático por hover — eso es lo que se sentía "molesto". Al
// seleccionar sí ajustamos el encuadre (ver FocusSelected) para que la
// inmobiliaria elegida nunca "se pierda" fuera de la vista.
function InitialView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center[0], center[1], zoom]);
  return null;
}

// Leaflet no detecta solo cuando su contenedor cambia de tamaño por causas
// externas (breakpoints responsive, el mapa pasando de "sticky" a apilado,
// zoom del navegador con Ctrl +/-, etc.) — si no se le avisa con
// invalidateSize(), el grid interno de tiles queda desalineado y el mapa se
// ve "roto"/cortado hasta la próxima interacción. Este observer lo mantiene sincronizado.
function ResizeSync() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

// Al seleccionar una inmobiliaria (desde la lista o el mapa): si su marcador
// no está visible en el encuadre actual, se hace un pan suave para mostrarlo
// (sin cambiar el zoom) y se abre su popup explícitamente. No reacciona a
// hover, solo a selección real.
function FocusSelected({
  agency,
  markerRefs,
}: {
  agency: InmobiliariaPublica | null;
  markerRefs: React.RefObject<Record<string, L.Marker | null>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!agency) return;
    const latlng = L.latLng(agency.lat, agency.lng);
    if (!map.getBounds().contains(latlng)) {
      map.panTo(latlng, { animate: true });
    }
    markerRefs.current[agency.id]?.openPopup();
  }, [agency, map, markerRefs]);
  return null;
}

// El popup de Leaflet desactiva la propagación nativa de clics para que no
// se confundan con clics al mapa (comportamiento estándar de Leaflet) — eso
// significa que un <button onClick> normal de React DENTRO de un Popup NUNCA
// se dispara, porque el evento nunca llega al listener delegado de React.
// Fix: listener nativo directo sobre el botón en vez de onClick.
function PopupActionButton({
  label,
  onAction,
  primary,
}: {
  label: string;
  onAction: () => void;
  primary?: boolean;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const handler = () => onAction();
    el.addEventListener('click', handler);
    return () => el.removeEventListener('click', handler);
  }, [onAction]);

  return (
    <button
      ref={ref}
      type="button"
      className={
        primary
          ? 'w-full rounded-lg bg-[#FF8000] py-2.5 text-[13px] font-bold text-white hover:opacity-90'
          : 'flex-1 rounded-md border border-[#E6E8EC] px-2 py-2 text-center text-[12px] font-bold text-[#1D2433] hover:border-[#FF8000] hover:text-[#FF8000]'
      }
    >
      {label}
    </button>
  );
}

function AgencyPopupContent({ agency, distanceKm }: { agency: InmobiliariaPublica; distanceKm: number | null }) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${agency.lat},${agency.lng}`;

  return (
    <div className="min-w-[220px]">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white shadow-sm"
          style={{ backgroundColor: agency.color_hex }}
        >
          {agency.nombre_comercial.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#1D2433]">{agency.nombre_comercial}</p>
          <p className="truncate text-[11px] text-[#6B7280]">{agency.poblacion}, {agency.provincia}</p>
        </div>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {distanceKm != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF8000]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF8000]">
            <MapPin size={9} /> {formatDistanceKm(distanceKm)}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          <Briefcase size={9} /> {agency.anos_experiencia} años
        </span>
      </div>

      <div className="mt-3">
        <PopupActionButton primary label="Ver perfil completo" onAction={() => navigateTo(`/inmobiliarias/${agency.id}`)} />
      </div>
      <div className="mt-1.5 flex gap-2">
        <a
          href={directionsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex-1 rounded-md border border-[#E6E8EC] px-2 py-2 text-center text-[12px] font-bold text-[#1D2433] transition-colors hover:border-[#FF8000] hover:text-[#FF8000]"
        >
          Cómo llegar
        </a>
      </div>
      <p className="mt-2 text-center text-[9px] text-slate-400">Doble clic en el marcador para ir directo al perfil</p>
    </div>
  );
}

export function AgencyMap({
  agencies,
  nearestId,
  searchPoint,
  center,
  zoom,
  hoveredId = null,
  selectedId = null,
  onSelect,
  onHover,
}: {
  agencies: InmobiliariaPublica[];
  nearestId: string | null;
  searchPoint: { lat: number; lng: number } | null;
  center: [number, number];
  zoom: number;
  hoveredId?: string | null;
  selectedId?: string | null;
  onSelect: (id: string) => void;
  onHover?: (id: string | null) => void;
}) {
  const markerRefs = useRef<Record<string, L.Marker | null>>({});
  const clickTimers = useRef<Record<string, ReturnType<typeof setTimeout> | undefined>>({});

  const iconFor = useMemo(
    () => (agency: InmobiliariaPublica) => {
      if (agency.id === selectedId) return ICONS.selected;
      if (agency.id === hoveredId) return ICONS.hover;
      if (agency.id === nearestId) return ICONS.defaultNearest;
      return ICONS.default;
    },
    [selectedId, hoveredId, nearestId],
  );

  const distanceFor = (agency: InmobiliariaPublica) => (searchPoint ? haversineKm(searchPoint, { lat: agency.lat, lng: agency.lng }) : null);

  const selectedAgency = selectedId ? agencies.find((a) => a.id === selectedId) ?? null : null;

  // Distinción manual click/doble-clic: el dblclick nativo del navegador
  // dispara igual un click antes, y coexistir con el toggle de icono al
  // seleccionar generaba carreras poco fiables. Con un pequeño debounce
  // propio, un solo clic siempre selecciona y un doble clic siempre navega.
  const handleMarkerClick = (agency: InmobiliariaPublica) => {
    const pending = clickTimers.current[agency.id];
    if (pending) {
      clearTimeout(pending);
      clickTimers.current[agency.id] = undefined;
      navigateTo(`/inmobiliarias/${agency.id}`);
      return;
    }
    clickTimers.current[agency.id] = setTimeout(() => {
      clickTimers.current[agency.id] = undefined;
      onSelect(agency.id);
    }, DOUBLE_CLICK_WINDOW_MS);
  };

  return (
    <div className="relative isolate h-full w-full overflow-hidden rounded-xl border border-[#E6E8EC]">
      <MapContainer
        center={center}
        zoom={zoom}
        className="h-full w-full"
        scrollWheelZoom={false}
        doubleClickZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <InitialView center={center} zoom={zoom} />
        <ResizeSync />
        <FocusSelected agency={selectedAgency} markerRefs={markerRefs} />

        {searchPoint && (
          <Marker position={[searchPoint.lat, searchPoint.lng]} icon={ICONS.search}>
            <Popup>Ubicación buscada</Popup>
          </Marker>
        )}

        {agencies.map((agency) => (
          <Marker
            key={agency.id}
            ref={(el) => { markerRefs.current[agency.id] = el; }}
            position={[agency.lat, agency.lng]}
            icon={iconFor(agency)}
            eventHandlers={{
              click: () => handleMarkerClick(agency),
              mouseover: () => onHover?.(agency.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Popup>
              <AgencyPopupContent agency={agency} distanceKm={distanceFor(agency)} />
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
