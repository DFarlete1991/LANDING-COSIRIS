import type { InmobiliariaPublica } from './inmobiliarias-mock';

export type CityIndexEntry = {
  city: string;
  province: string;
  count: number;
  lat: number;
  lng: number;
};

// Agrega las inmobiliarias por ciudad para mostrar conteos reales
// (no inventados) en el buscador y en la grilla "Busca por ciudad".
export function buildCityIndex(agencies: InmobiliariaPublica[]): CityIndexEntry[] {
  const acc = new Map<string, { city: string; province: string; count: number; latSum: number; lngSum: number }>();

  for (const agency of agencies) {
    // Sin lat/lng no hay forma de ubicar la ciudad en el mapa — se excluye del
    // índice (que alimenta el buscador/filtro por lugar), no de la lista general.
    if (agency.lat == null || agency.lng == null) continue;
    const city = agency.poblacion.trim();
    const province = agency.provincia.trim();
    const key = `${city}|${province}`;
    const existing = acc.get(key);
    if (existing) {
      existing.count += 1;
      existing.latSum += agency.lat;
      existing.lngSum += agency.lng;
    } else {
      acc.set(key, { city, province, count: 1, latSum: agency.lat, lngSum: agency.lng });
    }
  }

  return [...acc.values()]
    .map((e) => ({ city: e.city, province: e.province, count: e.count, lat: e.latSum / e.count, lng: e.lngSum / e.count }))
    .sort((a, b) => b.count - a.count);
}
