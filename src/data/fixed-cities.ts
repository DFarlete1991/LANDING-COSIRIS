import { buildCityIndex } from './city-index';
import type { InmobiliariaPublica } from './inmobiliarias-mock';

export const FIXED_CITIES: { city: string; province: string; lat: number; lng: number }[] = [
  { city: 'Madrid', province: 'Madrid', lat: 40.4168, lng: -3.7038 },
  { city: 'Barcelona', province: 'Barcelona', lat: 41.3874, lng: 2.1686 },
  { city: 'Valencia', province: 'Valencia', lat: 39.4699, lng: -0.3763 },
  { city: 'Sevilla', province: 'Sevilla', lat: 37.3891, lng: -5.9845 },
  { city: 'Bilbao', province: 'Vizcaya', lat: 43.2630, lng: -2.9350 },
  { city: 'Málaga', province: 'Málaga', lat: 36.7213, lng: -4.4214 },
];

export type CityWithCount = (typeof FIXED_CITIES)[number] & { count: number };

export function getAllCitiesWithCounts(agencies: InmobiliariaPublica[]): CityWithCount[] {
  const index = buildCityIndex(agencies);
  return FIXED_CITIES.map((c) => {
    const found = index.find((ci) => ci.city === c.city);
    return { ...c, count: found?.count ?? 0 };
  });
}

const DISTANCES_KM: Record<string, Record<string, number>> = {
  Madrid: { Barcelona: 505, Valencia: 302, Sevilla: 390, Bilbao: 325, Málaga: 423 },
  Barcelona: { Madrid: 505, Valencia: 303, Sevilla: 820, Bilbao: 465, Málaga: 775 },
  Valencia: { Madrid: 302, Barcelona: 303, Sevilla: 550, Bilbao: 480, Málaga: 460 },
  Sevilla: { Madrid: 390, Barcelona: 820, Valencia: 550, Bilbao: 650, Málaga: 160 },
  Bilbao: { Madrid: 325, Barcelona: 465, Valencia: 480, Sevilla: 650, Málaga: 615 },
  Málaga: { Madrid: 423, Barcelona: 775, Valencia: 460, Sevilla: 160, Bilbao: 615 },
};

export function getNearbyCities(city: string, limit = 3): string[] {
  const dists = DISTANCES_KM[city];
  if (!dists) return [];
  return Object.entries(dists)
    .sort(([, a], [, b]) => a - b)
    .slice(0, limit)
    .map(([name]) => name);
}
