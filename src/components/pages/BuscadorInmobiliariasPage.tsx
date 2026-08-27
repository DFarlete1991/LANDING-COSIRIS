import { useEffect, useState } from 'react';
import { Footer } from '../Footer';
import { LandingNavbar } from './landing-navbar';
import type { SearchSuggestion } from '../ui/AgencySearchBar';
import { InmobiliariasHomeView } from './inmobiliarias/InmobiliariasHomeView';
import { InmobiliariasResultsView } from './inmobiliarias/InmobiliariasResultsView';
import { navigateTo } from '@/lib/utils';
import { useSEO } from '@/lib/seo';

export function BuscadorInmobiliariasPage() {
  useSEO({
    path: '/inmobiliarias',
    title: 'Escoge la mejor inmobiliaria para venta de tu casa | Cosiris',
    description: '¿Cuánto vale tu propiedad? Escoge los mejores profesionales inmobiliarios verificados. Marketing para inmobiliarias, compradores y vendedores.',
  });

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

  // Vuelve a la home del directorio limpiando la búsqueda. No puede ser solo
  // un navigateTo: la URL cambiaría pero el estado de este componente
  // (query/searchPoint) sobrevive al re-render, así que sin reset seguiría
  // mostrando los resultados.
  const handleBack = () => {
    setQuery('');
    setSearchPoint(null);
    navigateTo('/inmobiliarias');
  };

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar invertOnScroll />

      {searchPoint ? (
        <InmobiliariasResultsView initialQuery={query} searchPoint={searchPoint} onSearch={handleSearch} onBack={handleBack} />
      ) : (
        <InmobiliariasHomeView onSearch={handleSearch} />
      )}

      <Footer />
    </div>
  );
}
