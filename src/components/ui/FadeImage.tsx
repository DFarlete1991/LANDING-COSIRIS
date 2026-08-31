import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';

// Las fotos/logos de las inmobiliarias tardan un poco en llegar (ver
// src/lib/image-optimize.ts) y sin esto se ven "aparecer a pedazos" mientras
// el navegador las va pintando. En vez de eso arrancan en opacity-0 y hacen
// fade-in al terminar de cargar (onLoad dispara igual si ya estaba en caché,
// solo que casi instantáneo). Si cambia el src (ej. rota a otra inmobiliaria
// en un carrusel) se reinicia el fade para la imagen nueva.
//
// Se usa `animate-fade-in` (keyframes, ver tailwind.config.js) y no
// transition-opacity a propósito: varias de estas imágenes ya tienen su
// propio transition-transform para el hover-scale, y dos utilidades de
// Tailwind que declaran transition-property compiten entre sí (solo una
// gana). Una animación de keyframes no toca transition-property, así que
// convive sin pisar esas otras transiciones.
export function FadeImage({ className = '', src, onLoad, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    setLoaded(false);
    // Si el navegador ya tiene la imagen en caché (típico al navegar dentro
    // de la SPA, no tanto en una carga nueva de la página), `complete` puede
    // venir en true desde este mismo render — el evento `load` nativo llega
    // tan rápido que a veces se dispara antes de que React termine de
    // conectar el onLoad de abajo, y la imagen se queda en opacity-0 para
    // siempre aunque el navegador ya la tenga descargada. Por eso hacía
    // falta un F5 para que "cargara": eso vacía la caché de la pestaña y
    // fuerza que `load` se dispare de nuevo a tiempo.
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  return (
    <img
      {...props}
      ref={imgRef}
      src={src}
      className={`${className} ${loaded ? 'animate-fade-in' : 'opacity-0'}`}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
