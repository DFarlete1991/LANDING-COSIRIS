import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps-loader';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

export function AgencyMap({
  agencies,
  center,
  zoom,
}: {
  agencies: InmobiliariaPublica[];
  searchPoint: { lat: number; lng: number } | null;
  center: [number, number];
  zoom: number;
}) {
  const located = agencies.filter((a): a is InmobiliariaPublica & { lat: number; lng: number } => a.lat != null && a.lng != null);
  const agency = located[0];

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#E6E8EC] bg-slate-100 text-xs text-slate-400">
        Mapa no disponible
      </div>
    );
  }

  if (!agency) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#E6E8EC] bg-slate-100 text-xs text-slate-400">
        Ubicación no disponible
      </div>
    );
  }

  const src = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${center[0]},${center[1]}&zoom=${zoom}&language=es`;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl">
      <iframe
        title="Ubicación"
        src={src}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
    </div>
  );
}
