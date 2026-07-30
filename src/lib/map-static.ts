import { GOOGLE_MAPS_API_KEY } from '@/lib/google-maps-loader';

export function gmapsAvailable(): boolean {
  return !!GOOGLE_MAPS_API_KEY;
}

type MarkerDef = {
  lat: number;
  lng: number;
  color?: string;
  label?: string;
  size?: 'tiny' | 'mid' | 'small';
};

export function staticMapUrl(
  center: { lat: number; lng: number },
  zoom: number,
  width: number,
  height: number,
  markers: MarkerDef[],
  opts?: { maptype?: string },
): string {
  const base = `https://maps.googleapis.com/maps/api/staticmap?center=${center.lat},${center.lng}&zoom=${zoom}&size=${Math.round(width)}x${Math.round(height)}&maptype=${opts?.maptype ?? 'roadmap'}`;

  const grouped = new Map<string, string[]>();
  for (const m of markers) {
    const parts: string[] = [];
    parts.push(`color:${m.color ?? 'orange'}`);
    if (m.size) parts.push(`size:${m.size}`);
    if (m.label && /^[A-Z0-9]$/i.test(m.label)) parts.push(`label:${m.label.toUpperCase()}`);
    const key = parts.join('|');
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(`${m.lat},${m.lng}`);
  }

  let url = base;
  for (const [style, coords] of grouped) {
    url += `&markers=${style}|${coords.join('|')}`;
  }

  url += `&key=${GOOGLE_MAPS_API_KEY}`;
  return url;
}
