import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, Building2, Loader2, MapPin, MapPinned, Menu, Search, X } from 'lucide-react';
import { navigateTo } from '@/lib/utils';
import { getAllCitiesWithCounts, getNearbyCities } from '@/data/fixed-cities';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { useUI } from '@/context/UIContext';
import { PlaceholderImage } from '@/components/ui/PlaceholderImage';
import { Button, buttonVariants } from '@/components/ui/button';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

export type SearchSuggestion = { label: string; lat: number; lng: number };

type Suggestion =
  | { type: 'city'; label: string; city: string; province: string; count: number; lat: number; lng: number }
  | { type: 'address'; label: string; lat: number; lng: number }
  | { type: 'agency'; label: string; id: string; poblacion: string };

// Mismos links que el resto del sitio (LandingNavbar) — el menú superior no
// puede cambiar según la sección en la que esté el usuario.
const LINKS = [
  { label: 'Servicios', href: '/servicios', hideOnMobile: true },
  { label: 'Nosotros', href: '/nosotros', hideOnMobile: true },
  { label: 'Vender Tu Vivienda', href: '/vendetuvivienda', hideOnMobile: true },
  { label: 'Inmobiliarias en tu zona', href: '/inmobiliarias', hideOnMobile: false },
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
  const { agencies, cityImages } = useInmobiliarias();
  const allCities = useMemo(() => getAllCitiesWithCounts(agencies), [agencies]);
  const { openContactModal } = useUI();

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

  // Búsqueda por nombre de inmobiliaria — funciona con o sin ubicación
  // fijada, navega directo al perfil en vez de ir por el flujo de distancia.
  const agencyMatches: Suggestion[] = (() => {
    const trimmed = query.trim().toLowerCase();
    if (trimmed.length < 2) return [];
    return agencies
      .filter((a) => a.nombre_comercial.toLowerCase().includes(trimmed))
      .slice(0, 5)
      .map((a) => ({ type: 'agency' as const, label: a.nombre_comercial, id: a.id, poblacion: a.poblacion }));
  })();

  const suggestions = [...agencyMatches, ...cityMatches, ...addressResults];

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
    if (trimmed.length < 3 || cityMatches.length > 0 || agencyMatches.length > 0) {
      setAddressResults([]);
      // Solo se abre si el input tiene foco — evita que un cambio programático
      // de `query` (p. ej. al llegar a resultados con initialValue) reabra el
      // dropdown sin que el usuario esté interactuando con el buscador.
      setIsOpen(isFocused && (cityMatches.length > 0 || agencyMatches.length > 0));
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
  }, [query, cityMatches.length, agencyMatches.length, isFocused]);

  const selectSuggestion = (suggestion: Suggestion) => {
    if (suggestion.type === 'agency') {
      setIsOpen(false);
      setIsFocused(false);
      navigateTo(`/inmobiliarias/${suggestion.id}`);
      return;
    }
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
    <header className="relative sticky top-0 z-50 flex h-[72px] w-full items-center gap-2 border-b border-slate-200 bg-white px-4 shadow-sm sm:gap-3 sm:px-6">
      {showBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95"
          aria-label="Volver"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Volver</span>
        </button>
      )}
      <a
        href='/inmobiliarias'
        onClick={(e) => { e.preventDefault(); navigateTo('/inmobiliarias'); }}
        className="shrink-0 transition-transform duration-200 hover:scale-105 active:scale-90"
      >
        <img src="/assets/logo_orange.png" alt="Cosiris" className="h-8 w-auto" />
      </a>

      {/* Desktop: enlaces centrados. En móvil desaparecen por completo (van al menú hamburguesa). */}
      <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center justify-center gap-0.5 md:flex md:gap-1">
        {LINKS.map((link) => (
          <button
            key={link.href}
            type="button"
            onClick={() => navigateTo(link.href)}
            className={`rounded-full px-3 py-2 text-[12px] font-semibold whitespace-nowrap text-slate-500 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900 active:scale-95 ${link.hideOnMobile ? 'hidden lg:inline-flex' : 'inline-flex'}`}
          >
            {link.label}
          </button>
        ))}
      </nav>

      {/* Buscador: en móvil ocupa el espacio flexible entre logo y hamburguesa; en desktop tiene ancho fijo a la derecha. */}
      <div className="min-w-0 flex-1 md:max-w-sm md:flex-none">
        {searchProps && (
          <div ref={wrapperRef} className="relative w-full">
            <div className="flex h-[44px] items-center gap-2 rounded-full border border-slate-200 bg-slate-100 pl-4 pr-3 text-sm text-slate-500 transition-all duration-200 focus-within:border-[#FF8000]/40 focus-within:bg-white focus-within:shadow-[0_0_0_4px_rgba(255,128,0,0.12)]">
              <Search size={18} className="shrink-0 text-slate-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => { if (!noAgenciesToast && suggestions.length > 0) setIsOpen(true); }}
                onKeyDown={handleKeyDown}
                placeholder="Busca una ciudad, barrio o inmobiliaria"
                className="h-full min-w-0 flex-1 bg-transparent font-medium text-slate-800 outline-none placeholder:text-slate-400"
              />
              {isSearching && <Loader2 size={16} className="animate-spin text-slate-400" />}
            </div>

            <AnimatePresence>
            {isOpen && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                style={{ transformOrigin: 'top' }}
                className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
              >
                {suggestions.map((s, index) => (
                  <li
                    key={`${s.type}-${s.label}-${index}`}
                    onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                    onMouseEnter={() => setHighlighted(index)}
                    className={`flex cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 transition-colors duration-150 ${
                      index === highlighted ? 'bg-slate-100' : 'hover:bg-slate-50'
                    }`}
                  >
                    {s.type === 'agency' ? (
                      <>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#FF8000]">
                          <Building2 size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-800">{s.label}</p>
                          {s.poblacion && <p className="truncate text-xs text-slate-400">{s.poblacion}</p>}
                        </div>
                      </>
                    ) : s.type === 'city' ? (
                      <>
                        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg">
                          {cityImages[s.city] ? (
                            <img src={cityImages[s.city]} alt={s.city} className="h-full w-full object-cover" />
                          ) : (
                            <PlaceholderImage icon="building" className="h-full w-full" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1 truncate text-sm font-semibold text-slate-800">
                            <MapPin size={12} className="shrink-0 text-[#FF8000]" /> {s.city}
                          </p>
                          <p className="truncate text-xs text-slate-400">{s.province}</p>
                        </div>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                          {s.count} {s.count === 1 ? 'inmobiliaria' : 'inmobiliarias'}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                          <MapPin size={16} />
                        </div>
                        <p className="truncate text-sm text-slate-700">{s.label}</p>
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
                  className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border border-[#FF8000]/20 bg-white shadow-xl shadow-slate-900/10"
                >
                  <div className="flex items-start gap-3 p-4">
                    <div className="mt-0.5 shrink-0">
                      <MapPinned size={18} className="text-[#FF8000]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-800">No hay inmobiliarias en {noAgenciesToast.city} todavía</p>
                      <p className="mt-1 text-xs text-slate-500">
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
                            {i < noAgenciesToast.nearby.length - 1 && <span className="text-slate-300">{', '}</span>}
                          </span>
                        ))}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNoAgenciesToast(null)}
                        className="shrink-0 rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
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

      {/* CTAs — mismas que en el navbar principal del sitio, solo visibles cuando hay espacio. */}
      <div className="ml-auto hidden shrink-0 items-center gap-2 lg:flex">
        <a
          href="https://crm.cosiris.com/"
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ variant: 'outline', className: 'text-xs' })}
        >
          Acceso Clientes
        </a>
        <Button className="text-xs" onClick={() => openContactModal({ sourceContext: 'navbar_inmobiliarias_empezar' })}>
          Empezar
        </Button>
      </div>

      {/* Hamburguesa: solo móvil, los enlaces (Inicio, Servicios, etc.) viven aquí en vez de competir por espacio con el buscador. */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="flex shrink-0 items-center justify-center rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
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
              className="absolute left-0 right-0 top-full z-40 flex flex-col gap-0.5 border-b border-slate-200 bg-white p-3 shadow-lg md:hidden"
            >
              {LINKS.map((link) => (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => { setMobileMenuOpen(false); navigateTo(link.href); }}
                  className="rounded-lg px-4 py-3 text-left text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  {link.label}
                </button>
              ))}
              <div className="mt-1 flex flex-col gap-2 border-t border-slate-100 pt-3">
                <a
                  href="https://crm.cosiris.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: 'outline' })}
                >
                  Acceso Clientes
                </a>
                <Button
                  className="w-full"
                  onClick={() => { setMobileMenuOpen(false); openContactModal({ sourceContext: 'navbar_inmobiliarias_empezar' }); }}
                >
                  Empezar
                </Button>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
    </header>
  );
}
