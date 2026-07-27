import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { INMOBILIARIAS_MOCK, type InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { fetchLiveInmobiliarias } from '@/data/live-inmobiliarias';
import { fetchLiveSiteAssets } from '@/data/live-site-assets';
import { CITY_IMAGES } from '@/data/city-images';

type InmobiliariasContextValue = {
  agencies: InmobiliariaPublica[];
  /** true una vez se confirmó que `agencies` viene de Supabase, no del mock. */
  isLive: boolean;
  loading: boolean;
  /** Fotos de ciudad editables por un admin desde el CRM, con fallback a las estáticas. */
  cityImages: Record<string, string>;
};

const InmobiliariasContext = createContext<InmobiliariasContextValue>({
  agencies: INMOBILIARIAS_MOCK,
  isLive: false,
  loading: false,
  cityImages: CITY_IMAGES,
});

export function InmobiliariasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InmobiliariasContextValue>({
    agencies: INMOBILIARIAS_MOCK,
    isLive: false,
    loading: true,
    cityImages: CITY_IMAGES,
  });

  useEffect(() => {
    let cancelled = false;

    fetchLiveInmobiliarias().then((live) => {
      if (cancelled) return;
      // Si Supabase no está configurado, la vista aún no existe, o todavía
      // ningún cliente activó mostrar_en_directorio con ubicación puesta,
      // se queda con el mock — nunca se muestra un directorio vacío por eso.
      if (live.length > 0) {
        setState((prev) => ({ ...prev, agencies: live, isLive: true, loading: false }));
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    fetchLiveSiteAssets().then((liveImages) => {
      if (cancelled || Object.keys(liveImages).length === 0) return;
      // Las claves de site_assets son "ciudad_madrid", etc. — se traducen a
      // nombres de ciudad para poder seguir indexando por `agency.poblacion`.
      const mapped: Record<string, string> = { ...CITY_IMAGES };
      for (const [key, url] of Object.entries(liveImages)) {
        const cityName = CITY_KEY_TO_NAME[key];
        if (cityName) mapped[cityName] = url;
      }
      setState((prev) => ({ ...prev, cityImages: mapped }));
    });

    return () => { cancelled = true; };
  }, []);

  return <InmobiliariasContext.Provider value={state}>{children}</InmobiliariasContext.Provider>;
}

const CITY_KEY_TO_NAME: Record<string, string> = {
  ciudad_madrid: 'Madrid',
  ciudad_barcelona: 'Barcelona',
  ciudad_valencia: 'Valencia',
  ciudad_malaga: 'Málaga',
  ciudad_sevilla: 'Sevilla',
  ciudad_bilbao: 'Bilbao',
};

export function useInmobiliarias() {
  return useContext(InmobiliariasContext);
}
