import { useEffect, useState } from 'react';
import { Footer } from '../Footer';
import type { SearchSuggestion } from './inmobiliarias/InmobiliariasNavbar';
import { InmobiliariasNavbar } from './inmobiliarias/InmobiliariasNavbar';
import { InmobiliariasHomeView } from './inmobiliarias/InmobiliariasHomeView';
import { InmobiliariasResultsView } from './inmobiliarias/InmobiliariasResultsView';

export function BuscadorInmobiliariasPage() {
  const [query, setQuery] = useState('');
  const [searchPoint, setSearchPoint] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const lat = params.get('lat');
    const lng = params.get('lng');
    const q = params.get('q');
    if (lat && lng && q) {
      setSearchPoint({ lat: Number(lat), lng: Number(lng) });
      setQuery(q);
    }
  }, []);

  const handleSearch = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.label);
    setSearchPoint({ lat: suggestion.lat, lng: suggestion.lng });
    const params = new URLSearchParams({ q: suggestion.label, lat: String(suggestion.lat), lng: String(suggestion.lng) });
    window.history.replaceState({}, '', `/inmobiliarias?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handleBack = () => {
    setQuery('');
    setSearchPoint(null);
    window.history.replaceState({}, '', '/inmobiliarias');
  };

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <InmobiliariasNavbar
        showBack={!!searchPoint}
        onBack={handleBack}
        searchProps={searchPoint ? { initialValue: query, onSelect: handleSearch } : undefined}
      />

      {searchPoint ? (
        <InmobiliariasResultsView initialQuery={query} searchPoint={searchPoint} />
      ) : (
        <InmobiliariasHomeView onSearch={handleSearch} />
      )}

      <Footer />
    </div>
  );
}
