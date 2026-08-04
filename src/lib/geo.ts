const EARTH_RADIUS_KM = 6371;

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function formatDistanceKm(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

// Google devuelve `formatted_address` en el idioma de la sesión del navegador
// (a menudo inglés: "Madrid, Spain" o "Community of Madrid"). En vez de
// mostrarlo tal cual, se reconstruye la etiqueta desde `address_components`,
// cuyos `long_name` ya vienen en español para España (calles, localidades,
// provincias), omitiendo el país para no incluir la nacionalidad en inglés.
export function formatSpanishAddressLabel(result: google.maps.GeocoderResult): string {
  const components = result.address_components;
  const find = (type: string) => components.find((c) => c.types.includes(type))?.long_name ?? '';
  const calle = find('route');
  const numero = find('street_number');
  const direccion = [calle, numero].filter(Boolean).join(', ');
  const localidad =
    find('locality') || find('postal_town') || find('sublocality') || find('administrative_area_level_3');
  const provincia = find('administrative_area_level_2') || find('administrative_area_level_1');
  const label = [direccion, localidad, provincia].filter(Boolean).join(', ');
  return label || result.formatted_address;
}
