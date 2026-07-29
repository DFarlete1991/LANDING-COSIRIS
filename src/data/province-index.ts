import type { InmobiliariaPublica } from './inmobiliarias-mock';

export type ProvinceIndexEntry = {
  province: string;
  count: number;
  lat: number;
  lng: number;
};

// Igual que buildCityIndex pero agrupado por provincia, para el mini mapa
// estático (conteo por región) junto al grid "Busca por ciudad".
export function buildProvinceIndex(agencies: InmobiliariaPublica[]): ProvinceIndexEntry[] {
  const acc = new Map<string, { province: string; count: number; latSum: number; lngSum: number }>();

  for (const agency of agencies) {
    // Sin lat/lng no hay forma de ubicar la provincia en el mini mapa —
    // se excluye del índice, no de la lista general de agencias.
    if (agency.lat == null || agency.lng == null) continue;
    const existing = acc.get(agency.provincia);
    if (existing) {
      existing.count += 1;
      existing.latSum += agency.lat;
      existing.lngSum += agency.lng;
    } else {
      acc.set(agency.provincia, { province: agency.provincia, count: 1, latSum: agency.lat, lngSum: agency.lng });
    }
  }

  return [...acc.values()]
    .map((e) => ({ province: e.province, count: e.count, lat: e.latSum / e.count, lng: e.lngSum / e.count }))
    .sort((a, b) => b.count - a.count);
}
