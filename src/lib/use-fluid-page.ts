import { useEffect } from 'react';

// En pantallas grandes (o con el navegador alejado) toda la página escala con el
// ancho, en vez de quedarse pequeña en el centro con los bordes vacíos. El tamaño
// solo cambia por encima de 1600 px: ver html.home-fluid en index.css.
export function useFluidPage() {
  useEffect(() => {
    document.documentElement.classList.add('home-fluid');
    return () => document.documentElement.classList.remove('home-fluid');
  }, []);
}
