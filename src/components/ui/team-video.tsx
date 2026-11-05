// Vídeo vertical del equipo, en la home y en Nosotros. Las burbujas nacen detrás
// del vídeo y flotan hacia afuera: cada una define su destino (--dx, --dy) y la
// animación es solo CSS (.video-bubble en index.css), sin coste para el vídeo.
// Como mucho se alejan 56 px, para no crear scroll lateral en móvil.

type Bubble = { side: 'left' | 'right'; top: number; size: number; dx: number; dy: number; seconds: number; delay: number; soft?: boolean };

const BUBBLES: Bubble[] = [
  { side: 'left', top: 12, size: 10, dx: -44, dy: -30, seconds: 4.6, delay: 0 },
  { side: 'left', top: 28, size: 18, dx: -52, dy: -44, seconds: 5.4, delay: -1.8, soft: true },
  { side: 'left', top: 44, size: 8, dx: -38, dy: -22, seconds: 4.2, delay: -3.1 },
  { side: 'left', top: 58, size: 14, dx: -56, dy: -36, seconds: 5, delay: -0.9 },
  { side: 'left', top: 72, size: 7, dx: -34, dy: -48, seconds: 4.4, delay: -2.4, soft: true },
  { side: 'left', top: 88, size: 12, dx: -48, dy: -26, seconds: 5.2, delay: -3.8 },
  { side: 'right', top: 8, size: 14, dx: 50, dy: -36, seconds: 5, delay: -2.2 },
  { side: 'right', top: 24, size: 8, dx: 36, dy: -28, seconds: 4.3, delay: -0.5, soft: true },
  { side: 'right', top: 38, size: 20, dx: 54, dy: -46, seconds: 5.6, delay: -3.4 },
  { side: 'right', top: 54, size: 9, dx: 40, dy: -24, seconds: 4.5, delay: -1.3 },
  { side: 'right', top: 68, size: 15, dx: 56, dy: -40, seconds: 5.1, delay: -4 },
  { side: 'right', top: 84, size: 7, dx: 34, dy: -34, seconds: 4.1, delay: -2.8, soft: true },
];

export function TeamVideo() {
  return (
    <div className="relative">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className={`video-bubble absolute rounded-full ${b.soft ? 'bg-[#FFB877]' : 'bg-[#FF8000]'} ${b.side === 'left' ? 'left-2' : 'right-2'}`}
            style={
              {
                top: `${b.top}%`,
                width: b.size,
                height: b.size,
                '--dx': `${b.dx}px`,
                '--dy': `${b.dy}px`,
                animationDuration: `${b.seconds}s`,
                animationDelay: `${b.delay}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <video
        src="/assets/home/equipo.mp4"
        poster="/assets/home/equipo-poster.webp"
        controls
        playsInline
        preload="none"
        aria-label="Vídeo de presentación del equipo de Cosiris"
        className="relative aspect-[9/16] w-full rounded-3xl bg-black object-cover shadow-[0_16px_40px_rgba(0,0,0,0.14)]"
      />
    </div>
  );
}
