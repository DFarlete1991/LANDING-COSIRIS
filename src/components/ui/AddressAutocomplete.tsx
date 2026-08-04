import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { Loader2, MapPin } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';
import { formatSpanishAddressLabel } from '@/lib/geo';

interface AddressAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  error?: boolean;
  onSelectDetails?: (details: {
    fullAddress: string;
    postalCode?: string;
    city?: string;
    province?: string;
    lat?: number;
    lng?: number;
  }) => void;
}

type GeocodeResult = {
  label: string;
  lat: number;
  lng: number;
  postalCode?: string;
  city?: string;
  province?: string;
};

const EXPO = [0.19, 1, 0.22, 1] as const;

const inputBaseClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

// Mismo mapeo que usa el registro de inmobiliarias (RegistroInmobiliariaPage) —
// Google devuelve la dirección ya desglosada en address_components, mucho más
// fiable para España que el geocoder de OpenStreetMap que usaba antes este campo.
function geocoderResultToPlace(result: google.maps.GeocoderResult): GeocodeResult {
  const find = (type: string) => result.address_components.find((c) => c.types.includes(type))?.long_name;
  return {
    label: formatSpanishAddressLabel(result),
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
    postalCode: find('postal_code'),
    city: find('locality') || find('postal_town') || find('sublocality') || find('administrative_area_level_3'),
    province: find('administrative_area_level_2') || find('administrative_area_level_1'),
  };
}

export function AddressAutocomplete({ value, onChange, error, onSelectDetails }: AddressAutocompleteProps) {
  const { isLoaded } = useJsApiLoader(googleMapsLoaderOptions);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const getGeocoder = () => {
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
    return geocoderRef.current;
  };

  const [query, setQuery] = useState(value);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

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
    const trimmed = query.trim();
    if (trimmed.length < 3 || !isLoaded) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await getGeocoder().geocode({ address: trimmed, region: 'es' });
        const mapped = response.results.slice(0, 6).map(geocoderResultToPlace);
        setResults(mapped);
        setHighlightedIndex(0);
        setIsOpen(mapped.length > 0);
      } catch (err) {
        console.error(err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [query, isLoaded]);

  const selectResult = (item: GeocodeResult) => {
    setQuery(item.label);
    onChange(item.label);
    setIsOpen(false);

    onSelectDetails?.({
      fullAddress: item.label,
      postalCode: item.postalCode,
      city: item.city,
      province: item.province,
      lat: item.lat,
      lng: item.lng,
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
              <p className="text-sm font-semibold text-slate-800">{item.label}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
