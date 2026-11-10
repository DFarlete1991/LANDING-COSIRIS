// Ejecuta `cb` en la primera interacción real (toque, clic, tecla, rueda o
// scroll) o, si nadie interactúa, pasados `fallbackMs`. Sirve para descargar
// lo que no hace falta para pintar la página (formulario, directorio) sin
// competir con la carga inicial: Lighthouse mide sin interactuar, y un usuario
// real lo tiene listo antes de necesitarlo. Devuelve la función de limpieza.
const EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart', 'scroll'] as const;

export function onFirstInteraction(cb: () => void, fallbackMs = 12000): () => void {
  let done = false;
  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    cb();
  };
  const timer = window.setTimeout(run, fallbackMs);
  const cleanup = () => {
    window.clearTimeout(timer);
    EVENTS.forEach((e) => window.removeEventListener(e, run));
  };
  EVENTS.forEach((e) => window.addEventListener(e, run, { once: true, passive: true }));
  return cleanup;
}
