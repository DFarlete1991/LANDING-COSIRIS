export interface GoogleReview {
  author_name: string;
  profile_photo_url: string;
  rating: number;
  text: string;
  relative_time_description: string;
  time: number;
}

export interface PlaceDetailsResult {
  name: string;
  rating: number;
  user_ratings_total: number;
  reviews: GoogleReview[];
}

// El endpoint REST clásico de Places (maps.googleapis.com/maps/api/place/...)
// no manda cabeceras CORS — está pensado para llamarse desde un servidor, no
// desde el navegador, así que un fetch() directo desde aquí siempre fallaba
// en silencio. La librería JS de Places (ya cargada vía useJsApiLoader con
// `libraries: ['places']`, ver google-maps-loader.ts) sí funciona en cliente.
// Por eso esta función requiere que el script de Google Maps ya esté cargado
// — quien la llama debe esperar a `isLoaded` de useJsApiLoader primero.
export function fetchPlaceReviews(placeId: string): Promise<PlaceDetailsResult | null> {
  if (!placeId || placeId.startsWith('REEMPLAZA')) return Promise.resolve(null);
  if (typeof google === 'undefined' || !google.maps?.places) return Promise.resolve(null);

  return new Promise((resolve) => {
    const service = new google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails(
      { placeId, fields: ['name', 'rating', 'reviews', 'user_ratings_total'], language: 'es' },
      (place, status) => {
        if (status !== google.maps.places.PlacesServiceStatus.OK || !place) {
          resolve(null);
          return;
        }
        resolve({
          name: place.name ?? '',
          rating: place.rating ?? 0,
          user_ratings_total: place.user_ratings_total ?? 0,
          reviews: (place.reviews ?? []).map((r) => ({
            author_name: r.author_name,
            profile_photo_url: r.profile_photo_url ?? '',
            rating: r.rating ?? 0,
            text: r.text ?? '',
            relative_time_description: r.relative_time_description ?? '',
            time: r.time ?? 0,
          })),
        });
      },
    );
  });
}
