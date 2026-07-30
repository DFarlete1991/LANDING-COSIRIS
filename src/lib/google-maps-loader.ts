// Opciones compartidas para useJsApiLoader (@react-google-maps/api).
//
// La librería mantiene un loader singleton por `id`: si dos componentes
// llaman a useJsApiLoader con el mismo id pero opciones distintas (libraries,
// version...), lanza "Loader must not be called again with different
// options" y el mapa deja de cargar en TODA la sesión del navegador, no solo
// en el componente que causó el conflicto — por eso esto vive en un único
// sitio en vez de repetirse en cada componente que use un mapa.
export const GOOGLE_MAPS_API_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? '';

const GOOGLE_MAPS_LIBRARIES: 'places'[] = ['places'];

export const googleMapsLoaderOptions = {
  id: 'google-map-script',
  googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  libraries: GOOGLE_MAPS_LIBRARIES,
};
