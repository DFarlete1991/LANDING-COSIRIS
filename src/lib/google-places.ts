import { GOOGLE_MAPS_API_KEY } from './google-maps-loader';

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

export async function fetchPlaceReviews(placeId: string): Promise<PlaceDetailsResult | null> {
  const key = GOOGLE_MAPS_API_KEY;
  if (!key || !placeId || placeId.startsWith('REEMPLAZA')) return null;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,reviews,user_ratings_total&language=es&key=${key}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.status !== 'OK') return null;
    return data.result;
  } catch {
    return null;
  }
}
