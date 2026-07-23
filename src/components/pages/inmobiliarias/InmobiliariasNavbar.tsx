import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { navigateTo } from '@/lib/utils';
import { CITY_INDEX } from '@/data/city-index';
import { CITY_IMAGES } from '@/data/city-images';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

export type SearchSuggestion = { label: string; lat: number; lng: number };

type Suggestion =
  | { type: 'city'; label: string; city: string; province: string; count: number; lat: number; lng: number }
  | { type: 'address'; label: string; lat: number; lng: number };

const LINKS = [
  { label: 'Inicio', href: '/inmobiliarias' },
  { label: 'Para inmobiliarias', href: '/captacion_inmobiliarias' },
  { label: 'Cosiris', href: '/' },
];

export function InmobiliariasNavbar({
  showBack,
  onBack,
  searchProps,
}: {
  showBack?: boolean;
  onBack?: () => void;
  searchProps?: {
    initialValue?: string;
    onSelect: (suggestion: SearchSuggestion) => void;
  };
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const provider = useRef(
    new OpenStreetMapProvider({
      params: { countrycodes: 'es', addressdetails: 0, dedupe: 1, limit: 4, 'accept-language': 'es' },
    }),
  );

  const [query, setQuery] = useState(searchProps?.initialValue ?? '');
  const [addressResults, setAddressResults] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(searchProps?.initialValue ?? '');
  }, [searchProps?.initialValue]);

  const cityMatches: Suggestion[] = (() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) return [];
    return CITY_INDEX.filter(
      (c) => c.city.toLowerCase().includes(trimmed) || c.province.toLowerCase().includes(trimmed),
    )
      .slice(0, 5)
      .map((c) => ({ type: 'city' as const, label: `${c.city}, ${c.province}`, city: c.city, province: c.province, count: c.count, lat: c.lat, lng: c.lng }));
  })();

  const suggestions = [...cityMatches, ...addressResults];

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
      setAddressResults([]);
      setIsOpen(cityMatches.length > 0);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await provider.current.search({ query: trimmed });
        setAddressResults(results.map((r) => ({ type: 'address' as const, label: r.label, lat: r.y, lng: r.x })));
        setHighlighted(0);
        setIsOpen(results.length > 0);
      } catch {
        //
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [query, cityMatches.length]);

  const selectSuggestion = (suggestion: Suggestion) => {
    setQuery(suggestion.label);
    setIsOpen(false);
    searchProps?.onSelect({ label: suggestion.label, lat: suggestion.lat, lng: suggestion.lng });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); setHighlighted((prev) => Math.min(prev + 1, suggestions.length - 1)); }
    if (event.key === 'ArrowUp') { event.preventDefault(); setHighlighted((prev) => Math.max(prev - 1, 0)); }
    if (event.key === 'Enter') { event.preventDefault(); if (suggestions[highlighted]) selectSuggestion(suggestions[highlighted]); }
    if (event.key === 'Escape') setIsOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-50 flex h-[72px] w-full items-center justify-between gap-3 border-b px-6 transition-all duration-300 ${
        scrolled
          ? 'border-white/10 bg-[#0F172A]/90 shadow-lg shadow-black/20 backdrop-blur-xl'
          : 'border-white/10 bg-[#0F172A]'
      }`}
    >
      <div className="flex flex-1 items-center gap-4 min-w-0">
        <a
          href={showBack ? '#' : '/inmobiliarias'}
          onClick={(e) => { e.preventDefault(); showBack ? onBack?.() : navigateTo('/inmobiliarias'); }}
          className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-90"
        >
          <img src="/assets/logo_white.png" alt="Cosiris" className="h-8 w-auto" />
        </a>

        {searchProps && (
          <div ref={wrapperRef} className="relative flex-1 max-w-md">
            <div className="flex h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/10 pl-4 pr-3 text-sm text-white/60 transition-all duration-200 focus-within:border-[#FF8000]/40 focus-within:bg-white/15 focus-within:shadow-[0_0_0_4px_rgba(255,128,0,0.12)]">
              <Search size={18} className="shrink-0 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Busca una ciudad, barrio o inmobiliaria"
                className="h-full min-w-0 flex-1 bg-transparent font-medium text-white placeholder:text-white/40 outline-none"
              />
              {isSearching && <Loader2 size={16} className="animate-spin text-white/40" />}
            </div>

            {isOpen && suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl shadow-black/40">
                {suggestions.map((s, index) => (
                  <li
                    key={`${s.type}-${s.label}-${index}`}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex cursor-pointer items-center gap-3 border-b border-white/5 px-4 py-3 last:border-0 transition-colors duration-150 ${
                      index === highlighted ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {s.type === 'city' ? (
                      <>
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                          {CITY_IMAGES[s.city] ? (
                            <img src={CITY_IMAGES[s.city]} alt={s.city} className="h-full w-full object-cover" />
                          ) : (
                            <PlaceholderImage icon="building" className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 truncate text-sm font-semibold text-white">
                            <MapPin size={12} className="shrink-0 text-[#FF8000]" /> {s.city}
                          </p>
                          <p className="truncate text-xs text-white/50">{s.province}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/70">
                          {s.count} {s.count === 1 ? 'inmobiliaria' : 'inmobiliarias'}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/50">
                          <MapPin size={16} />
                        </div>
                        <p className="truncate text-sm text-white/80">{s.label}</p>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      <nav className="flex shrink-0 items-center gap-0.5 md:gap-1">
        {LINKS.map((link) => (
          <button
            key={link.href}
            type="button"
            onClick={() => navigateTo(link.href)}
            className="rounded-full px-3 py-2 text-[12px] font-semibold text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 md:px-3.5 md:text-xs"
          >
            {link.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
