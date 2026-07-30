import { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, InfoWindow, useJsApiLoader } from '@react-google-maps/api';
import { Briefcase, MapPin } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { haversineKm, formatDistanceKm } from '@/lib/geo';
import { gmapsAvailable } from '@/lib/map-static';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';

const containerStyle = { width: '100%', height: '100%' };

const mapOptions: google.maps.MapOptions = {
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  zoomControl: true,
  styles: [
    { featureType: 'poi', stylers: [{ visibility: 'off' }] },
    { featureType: 'transit', stylers: [{ visibility: 'off' }] },
    {
      featureType: 'landscape',
      elementType: 'geometry.fill',
      stylers: [{ color: '#f7f5f0' }],
    },
    {
      featureType: 'road',
      elementType: 'geometry',
      stylers: [{ color: '#ffffff' }, { lightness: -8 }],
    },
    {
      featureType: 'water',
      elementType: 'geometry.fill',
      stylers: [{ color: '#e1e8ed' }],
    },
    {
      featureType: 'road',
      elementType: 'labels.text.fill',
      stylers: [{ color: '#9ca3af' }, { lightness: 10 }],
    },
  ],
};

type LocatedAgency = InmobiliariaPublica & { lat: number; lng: number };

function AgencyInfoWindow({ agency, distanceKm }: { agency: LocatedAgency; distanceKm: number | null }) {
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${agency.lat},${agency.lng}`;

  return (
    <div className="min-w-[200px] font-sans">
      <div className="flex items-center gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
          style={{ backgroundColor: agency.color_hex }}
        >
          {agency.nombre_comercial.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#1D2433]">{agency.nombre_comercial}</p>
          <p className="truncate text-[11px] text-[#6B7280]">{agency.poblacion}</p>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5">
        {distanceKm != null && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#FF8000]/10 px-2 py-0.5 text-[10px] font-bold text-[#FF8000]">
            <MapPin size={9} /> {formatDistanceKm(distanceKm)}
          </span>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
          <Briefcase size={9} /> {agency.anos_experiencia} años
        </span>
      </div>

      <a
        href={directionsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-[#FF8000] py-2 text-[13px] font-bold text-white hover:opacity-90"
      >
        <MapPin size={14} /> Cómo llegar
      </a>
    </div>
  );
}

const AGENCY_ICON = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: '#FF8000',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 3,
  scale: 11,
});

const SEARCH_ICON = (): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: '#2563EB',
  fillOpacity: 1,
  strokeColor: '#FFFFFF',
  strokeWeight: 2,
  scale: 7,
});

export function AgencyMap({
  agencies,
  searchPoint,
  center,
  zoom,
}: {
  agencies: InmobiliariaPublica[];
  searchPoint: { lat: number; lng: number } | null;
  center: [number, number];
  zoom: number;
}) {
  const { isLoaded } = useJsApiLoader(googleMapsLoaderOptions);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  // Agencias sin ubicación (p. ej. clientes de prueba que no fijaron el mapa)
  // no tienen pin que mostrar — se excluyen solo de este componente.
  const locatedAgencies: LocatedAgency[] = agencies.filter(
    (a): a is LocatedAgency => a.lat != null && a.lng != null,
  );

  const selectedAgency = selectedId ? locatedAgencies.find((a) => a.id === selectedId) ?? null : null;

  const distanceFor = (agency: LocatedAgency) =>
    searchPoint ? haversineKm(searchPoint, { lat: agency.lat, lng: agency.lng }) : null;

  if (!gmapsAvailable()) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#E6E8EC] bg-slate-100 text-xs text-slate-400">
        Mapa no disponible
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#E6E8EC] bg-slate-100 text-xs text-slate-400">
        Cargando mapa…
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-[#E6E8EC]">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat: center[0], lng: center[1] }}
        zoom={zoom}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={mapOptions}
      >
        {searchPoint && (
          <Marker
            position={{ lat: searchPoint.lat, lng: searchPoint.lng }}
            icon={SEARCH_ICON()}
            title="Ubicación buscada"
          />
        )}

        {locatedAgencies.map((agency) => (
          <Marker
            key={agency.id}
            position={{ lat: agency.lat, lng: agency.lng }}
            icon={AGENCY_ICON()}
            title={agency.nombre_comercial}
            onClick={() => setSelectedId(agency.id)}
          />
        ))}

        {selectedAgency && (
          <InfoWindow
            position={{ lat: selectedAgency.lat, lng: selectedAgency.lng }}
            onCloseClick={() => setSelectedId(null)}
          >
            <AgencyInfoWindow agency={selectedAgency} distanceKm={distanceFor(selectedAgency)} />
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
