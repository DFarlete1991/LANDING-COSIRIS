import { useEffect, useState, type ImgHTMLAttributes } from 'react';

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

  useEffect(() => {
    setLoaded(false);
  }, [src]);

  return (
    <img
      {...props}
      src={src}
      className={`${className} ${loaded ? 'animate-fade-in' : 'opacity-0'}`}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
    />
  );
}
