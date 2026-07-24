import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { INMOBILIARIAS_MOCK, type InmobiliariaPublica } from '@/data/inmobiliarias-mock';
import { fetchLiveInmobiliarias } from '@/data/live-inmobiliarias';

type InmobiliariasContextValue = {
  agencies: InmobiliariaPublica[];
  /** true una vez se confirmó que `agencies` viene de Supabase, no del mock. */
  isLive: boolean;
  loading: boolean;
};

const InmobiliariasContext = createContext<InmobiliariasContextValue>({
  agencies: INMOBILIARIAS_MOCK,
  isLive: false,
  loading: false,
});

export function InmobiliariasProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InmobiliariasContextValue>({
    agencies: INMOBILIARIAS_MOCK,
    isLive: false,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    fetchLiveInmobiliarias().then((live) => {
      if (cancelled) return;
      // Si Supabase no está configurado, la vista aún no existe, o todavía
      // ningún cliente activó mostrar_en_directorio con ubicación puesta,
      // se queda con el mock — nunca se muestra un directorio vacío por eso.
      if (live.length > 0) {
        setState({ agencies: live, isLive: true, loading: false });
      } else {
        setState((prev) => ({ ...prev, loading: false }));
      }
    });

    return () => { cancelled = true; };
  }, []);

  return <InmobiliariasContext.Provider value={state}>{children}</InmobiliariasContext.Provider>;
}

export function useInmobiliarias() {
  return useContext(InmobiliariasContext);
}
