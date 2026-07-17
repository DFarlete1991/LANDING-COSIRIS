import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { OpenStreetMapProvider } from 'leaflet-geosearch';

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  onSelectDetails?: (details: {
    fullAddress: string;
    postalCode?: string;
    city?: string;
    province?: string;
  }) => void;
}

interface OSMAddress {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
}

interface OSMRawResult {
  display_name: string;
  address?: OSMAddress;
}

interface ProviderResult {
  label: string;
  raw: OSMRawResult;
}

const EXPO = [0.19, 1, 0.22, 1] as const;

const inputBaseClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

function formatSuggestion(displayName: string): string {
  const segments = displayName.split(',').map((part) => part.trim()).filter(Boolean);
  return segments.slice(0, 3).join(', ');
}

function normalizePostalCode(postcode?: string): string | undefined {
  if (!postcode) return undefined;
  const digits = postcode.replace(/\D/g, '').slice(0, 5);
  return digits.length === 5 ? digits : undefined;
}

export function AddressAutocomplete({ value, onChange, error, onSelectDetails }: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<ProviderResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const provider = useMemo(
    () =>
      new OpenStreetMapProvider({
        params: {
          countrycodes: 'es',
          addressdetails: 1,
          dedupe: 1,
          limit: 6,
          'accept-language': 'es',
        },
      }),
    [],
  );

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchAddresses = async () => {
      const trimmed = query.trim();
      if (trimmed.length < 3) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = (await provider.search({ query: trimmed })) as ProviderResult[];
        setResults(data);
        setHighlightedIndex(0);
        setIsOpen(data.length > 0);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(fetchAddresses, 300);
    return () => clearTimeout(timeoutId);
  }, [provider, query, value]);

  const selectResult = (item: ProviderResult) => {
    const raw = item.raw;
    const fullAddress = raw.display_name;
    setQuery(fullAddress);
    onChange(fullAddress);
    setIsOpen(false);

    const postalCode = normalizePostalCode(raw.address?.postcode);
    const city = raw.address?.city || raw.address?.town || raw.address?.village;

    onSelectDetails?.({
      fullAddress,
      postalCode,
      city,
      province: raw.address?.state,
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, results.length - 1));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      selectResult(results[highlightedIndex]);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
        onKeyDown={handleKeyDown}
        placeholder="Ej. Calle Mayor 1, Madrid"
        className={`${inputBaseClass} pr-10 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
      />
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
        {isLoading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <MapPin size={16} />
        )}
      </div>
      {isOpen && results.length > 0 && (
        <ul
          className="absolute z-[90] mt-1 w-full max-h-64 overflow-auto rounded-md border border-slate-200 bg-white/95 py-1 shadow-xl backdrop-blur-sm"
          style={{ transitionTimingFunction: `cubic-bezier(${EXPO.join(',')})` }}
        >
          {results.map((item, index) => (
            <li
              key={`${item.label}-${index}`}
              className={`cursor-pointer border-b border-slate-50 px-4 py-3 leading-tight last:border-0 ${
                index === highlightedIndex ? 'bg-orange-50' : 'hover:bg-slate-50'
              }`}
              onMouseDown={(event) => {
                event.preventDefault();
                selectResult(item);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <p className="text-sm font-semibold text-slate-800">{formatSuggestion(item.raw.display_name)}</p>
              <p className="mt-0.5 text-xs text-slate-500">{item.raw.display_name}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
