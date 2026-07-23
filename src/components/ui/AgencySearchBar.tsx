import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';
import { Loader2, MapPin, Search } from 'lucide-react';
import { CITY_INDEX } from '@/data/city-index';
import { CITY_IMAGES } from '@/data/city-images';
import { PlaceholderImage } from './PlaceholderImage';

export type SearchSuggestion = { label: string; lat: number; lng: number };

type Suggestion =
  | { type: 'city'; label: string; city: string; province: string; count: number; lat: number; lng: number }
  | { type: 'address'; label: string; lat: number; lng: number };

function useGeocodeFallback() {
  const provider = useMemo(
    () =>
      new OpenStreetMapProvider({
        params: { countrycodes: 'es', addressdetails: 0, dedupe: 1, limit: 4, 'accept-language': 'es' },
      }),
    [],
  );

  return async (query: string): Promise<Suggestion[]> => {
    const results = await provider.search({ query });
    return results.map((r) => ({ type: 'address' as const, label: r.label, lat: r.y, lng: r.x }));
  };
}

export function AgencySearchBar({
  initialValue = '',
  placeholder = '¿En qué ciudad o dirección buscas?',
  size = 'compact',
  onSelect,
}: {
  initialValue?: string;
  placeholder?: string;
  size?: 'hero' | 'compact';
  onSelect: (suggestion: SearchSuggestion) => void;
}) {
  const geocodeFallback = useGeocodeFallback();
  const [query, setQuery] = useState(initialValue);
  const [addressResults, setAddressResults] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const cityMatches: Suggestion[] = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) return [];
    return CITY_INDEX.filter(
      (c) => c.city.toLowerCase().includes(trimmed) || c.province.toLowerCase().includes(trimmed),
    )
      .slice(0, 5)
      .map((c) => ({ type: 'city' as const, label: `${c.city}, ${c.province}`, city: c.city, province: c.province, count: c.count, lat: c.lat, lng: c.lng }));
  }, [query]);

  const suggestions = useMemo(() => [...cityMatches, ...addressResults], [cityMatches, addressResults]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || cityMatches.length > 0) {
      // Si ya hay match de ciudad conocida, no hace falta golpear la API de geocoding.
      setAddressResults([]);
      setIsOpen(cityMatches.length > 0);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await geocodeFallback(trimmed);
        setAddressResults(results);
        setHighlighted(0);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, cityMatches.length, geocodeFallback]);

  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.label);
    setIsOpen(false);
    onSelect({ label: suggestion.label, lat: suggestion.lat, lng: suggestion.lng });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (suggestions[highlighted]) selectSuggestion(suggestions[highlighted]);
    }
    if (event.key === 'Escape') setIsOpen(false);
  };

  const handleSubmit = () => {
    if (suggestions[highlighted]) {
      selectSuggestion(suggestions[highlighted]);
    } else if (suggestions.length > 0) {
      selectSuggestion(suggestions[0]);
    }
  };

  const isHero = size === 'hero';

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center gap-2 rounded-full border border-slate-200 bg-white transition-all focus-within:border-[#FF8000] focus-within:ring-4 focus-within:ring-[#FF8000]/15 ${
          isHero ? 'p-2 shadow-2xl shadow-slate-900/20' : 'p-1 shadow-sm'
        }`}
      >
        <div className="relative flex-1">
          <Search
            size={isHero ? 18 : 16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full rounded-full bg-transparent pl-11 pr-4 font-medium text-slate-900 placeholder:text-slate-400 outline-none ${
              isHero ? 'py-3 text-base' : 'py-2.5 text-sm'
            }`}
          />
          {isSearching && (
            <Loader2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
          )}
        </div>

        {isHero && (
          <button
            type="button"
            onClick={handleSubmit}
            className="flex shrink-0 items-center gap-2 rounded-full bg-[#FF8000] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#E67300] active:scale-95"
          >
            <Search size={16} /> Buscar
          </button>
        )}
      </div>

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/15">
          {suggestions.map((s, index) => (
            <li
              key={`${s.type}-${s.label}-${index}`}
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
              onMouseEnter={() => setHighlighted(index)}
              className={`flex cursor-pointer items-center gap-3 border-b border-slate-50 px-4 py-3 last:border-0 transition-colors duration-150 ${
                index === highlighted ? 'bg-orange-50' : 'hover:bg-slate-50'
              }`}
            >
              {s.type === 'city' ? (
                <>
                  <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg shadow-sm">
                    {CITY_IMAGES[s.city] ? (
                      <img src={CITY_IMAGES[s.city]} alt={s.city} className="h-full w-full object-cover" />
                    ) : (
                      <PlaceholderImage icon="building" className="h-full w-full" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 truncate text-sm font-semibold text-slate-800">
                      <MapPin size={12} className="shrink-0 text-[#FF8000]" /> {s.city}
                    </p>
                    <p className="truncate text-xs text-slate-500">{s.province}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                    {s.count} {s.count === 1 ? 'inmobiliaria' : 'inmobiliarias'}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 shadow-sm">
                    <MapPin size={16} />
                  </div>
                  <p className="truncate text-sm text-slate-700">{s.label}</p>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
