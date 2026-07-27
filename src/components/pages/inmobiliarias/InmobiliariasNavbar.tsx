import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, MapPin, MapPinned, Menu, Search, X } from 'lucide-react';
import { navigateTo } from '@/lib/utils';
import { getAllCitiesWithCounts, getNearbyCities } from '@/data/fixed-cities';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

export type SearchSuggestion = { label: string; lat: number; lng: number };

type Suggestion =
  | { type: 'city'; label: string; city: string; province: string; count: number; lat: number; lng: number }
  | { type: 'address'; label: string; lat: number; lng: number };

const LINKS = [
  { label: 'Inicio', href: '/', hideOnMobile: false },
  { label: 'Para inmobiliarias', href: '/captacion_inmobiliarias', hideOnMobile: false },
  { label: 'Servicios', href: '/servicios', hideOnMobile: true },
  { label: 'Nosotros', href: '/nosotros', hideOnMobile: true },
  { label: 'Vender Tu Vivienda', href: '/vendetuvivienda', hideOnMobile: true },
  { label: 'Cosiris', href: '/', hideOnMobile: false },
];

export function InmobiliariasNavbar({
  showBack,
  onBack,
  searchProps,
  transparent,
}: {
  showBack?: boolean;
  onBack?: () => void;
  searchProps?: {
    initialValue?: string;
    onSelect: (suggestion: SearchSuggestion) => void;
  };
  /** Se funde con el fondo (hero) hasta hacer scroll — solo tiene sentido cuando hay una foto/vídeo detrás. */
  transparent?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const { agencies, cityImages } = useInmobiliarias();
  const allCities = useMemo(() => getAllCitiesWithCounts(agencies), [agencies]);

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
  const [isFocused, setIsFocused] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [noAgenciesToast, setNoAgenciesToast] = useState<{ city: string; nearby: string[] } | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!noAgenciesToast) return;
    const t = setTimeout(() => setNoAgenciesToast(null), 5000);
    return () => clearTimeout(t);
  }, [noAgenciesToast]);

  useEffect(() => {
    setQuery(searchProps?.initialValue ?? '');
  }, [searchProps?.initialValue]);

  const cityMatches: Suggestion[] = (() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length === 0) return [];
    return allCities
      .filter(
        (c) => c.city.toLowerCase().includes(trimmed) || c.province.toLowerCase().includes(trimmed),
      )
      .slice(0, 5)
      .map((c) => ({ type: 'city' as const, label: `${c.city}, ${c.province}`, city: c.city, province: c.province, count: c.count, lat: c.lat, lng: c.lng }));
  })();

  const suggestions = [...cityMatches, ...addressResults];

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || cityMatches.length > 0) {
      setAddressResults([]);
      // Solo se abre si el input tiene foco — evita que un cambio programático
      // de `query` (p. ej. al llegar a resultados con initialValue) reabra el
      // dropdown sin que el usuario esté interactuando con el buscador.
      setIsOpen(isFocused && cityMatches.length > 0);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await provider.current.search({ query: trimmed });
        setAddressResults(results.map((r) => ({ type: 'address' as const, label: r.label, lat: r.y, lng: r.x })));
        setHighlighted(0);
        setIsOpen(isFocused && results.length > 0);
      } catch {
        //
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timeoutId);
  }, [query, cityMatches.length, isFocused]);

  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'city' && suggestion.count === 0) {
      setNoAgenciesToast({ city: suggestion.city, nearby: getNearbyCities(suggestion.city) });
      setIsOpen(false);
      setIsFocused(false);
      return;
    }
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
      className={`sticky top-0 z-50 flex h-[72px] w-full items-center gap-2 border-b px-4 transition-all duration-300 sm:gap-3 sm:px-6 ${
        scrolled
          ? 'border-white/10 bg-black/90 shadow-lg shadow-black/20 backdrop-blur-xl'
          : transparent
            ? 'border-transparent bg-gradient-to-b from-black/45 via-black/15 to-transparent'
            : 'border-white/10 bg-black'
      }`}
    >
      <a
        href={showBack ? '#' : '/inmobiliarias'}
        onClick={(e) => { e.preventDefault(); showBack ? onBack?.() : navigateTo('/inmobiliarias'); }}
        className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-90"
      >
        <img src="/assets/logo_white.png" alt="Cosiris" className="h-8 w-auto" />
      </a>

      {/* Desktop: enlaces centrados. En móvil desaparecen por completo (van al menú hamburguesa). */}
      <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex md:gap-1">
        {LINKS.map((link) => (
          <button
            key={link.href}
            type="button"
            onClick={() => navigateTo(link.href)}
            className={`rounded-full px-3 py-2 text-[12px] font-semibold whitespace-nowrap text-white/60 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-95 md:px-3.5 md:text-xs ${
              link.hideOnMobile ? 'hidden lg:inline-flex' : 'inline-flex'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Buscador: en móvil ocupa el espacio flexible entre logo y hamburguesa; en desktop tiene ancho fijo a la derecha. */}
      <div className="min-w-0 flex-1 md:max-w-sm md:flex-none">
        {searchProps && (
          <div ref={wrapperRef} className="relative w-full">
            <div className="flex h-[44px] items-center gap-2 rounded-full border border-white/15 bg-white/10 pl-4 pr-3 text-sm text-white/60 transition-all duration-200 focus-within:border-[#FF8000]/40 focus-within:bg-white/15 focus-within:shadow-[0_0_0_4px_rgba(255,128,0,0.12)]">
              <Search size={18} className="shrink-0 text-white/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (!noAgenciesToast && suggestions.length > 0) setIsOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Busca una ciudad, barrio o inmobiliaria"
                className="h-full min-w-0 flex-1 bg-transparent font-medium text-white placeholder:text-white/40 outline-none"
              />
              {isSearching && <Loader2 size={16} className="animate-spin text-white/40" />}
            </div>

            <AnimatePresence>
            {isOpen && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: 'top' }}
                className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl shadow-black/40"
              >
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
                          {cityImages[s.city] ? (
                            <img src={cityImages[s.city]} alt={s.city} className="h-full w-full object-cover" />
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
              </motion.ul>
            )}
            </AnimatePresence>

            <AnimatePresence>
              {noAgenciesToast && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                  className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-[#FF8000]/20 bg-[#0F172A] shadow-2xl shadow-black/30"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 shrink-0">
                      <MapPinned size={18} className="text-[#FF8000]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white">No hay inmobiliarias en {noAgenciesToast.city} todavía</p>
                      <p className="mt-1 text-xs text-white/60">
                        Prueba en{' '}
                        {noAgenciesToast.nearby.map((name, i) => (
                          <span key={name}>
                            <button
                              type="button"
                              onClick={() => {
                                const target = allCities.find((ac) => ac.city === name);
                                if (target) {
                                  setNoAgenciesToast(null);
                                  searchProps?.onSelect({ label: `${target.city}, ${target.province}`, lat: target.lat, lng: target.lng });
                                }
                              }}
                              className="font-semibold text-[#FF8000] underline underline-offset-2 hover:text-orange-400"
                            >
                              {name}
                            </button>
                            {i < noAgenciesToast.nearby.length - 1 && <span className="text-white/40">{', '}</span>}
                          </span>
                        ))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoAgenciesToast(null)}
                      className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Hamburguesa: solo móvil, los enlaces (Inicio, Servicios, etc.) viven aquí en vez de competir por espacio con el buscador. */}
      <button
        type="button"
        onClick={() => setMobileMenuOpen((v) => !v)}
        aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
        className="flex shrink-0 items-center justify-center rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white md:hidden"
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute left-0 right-0 top-full z-40 flex flex-col gap-0.5 border-b border-white/10 bg-black p-3 md:hidden"
          >
            {LINKS.map((link) => (
              <button
                key={link.href}
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigateTo(link.href); }}
                className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {link.label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
