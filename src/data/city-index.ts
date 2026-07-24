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
    const key = `${agency.poblacion}|${agency.provincia}`;
    const existing = acc.get(key);
    if (existing) {
      existing.count += 1;
      existing.latSum += agency.lat;
      existing.lngSum += agency.lng;
    } else {
      acc.set(key, { city: agency.poblacion, province: agency.provincia, count: 1, latSum: agency.lat, lngSum: agency.lng });
    }
  }

  return [...acc.values()]
    .map((e) => ({ city: e.city, province: e.province, count: e.count, lat: e.latSum / e.count, lng: e.lngSum / e.count }))
    .sort((a, b) => b.count - a.count);
}
