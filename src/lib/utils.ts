type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | Record<string, boolean | undefined | null>;

export function cn(...inputs: ClassValue[]) {
  const classes: string[] = [];

  const append = (value: ClassValue) => {
    if (!value) return;

    if (typeof value === 'string' || typeof value === 'number') {
      classes.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(append);
      return;
    }

    if (typeof value === 'object') {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) classes.push(key);
      });
    }
  };

  inputs.forEach(append);
  return classes.join(' ');
}

export function navigateTo(href: string) {
  window.history.pushState({}, '', href);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

const LAST_DIRECTORY_URL_KEY = 'cosiris:lastDirectoryUrl';

// El botón "Volver al directorio" del perfil no puede reconstruir la URL de
// origen a partir de la query (búsqueda con filtros, sección principal,
// carrusel de vídeos... cada una tiene una forma distinta) — en vez de eso,
// se guarda la URL exacta justo antes de navegar a un perfil, sea cual sea
// la sección desde la que se venga.
export function rememberDirectoryUrl() {
  sessionStorage.setItem(LAST_DIRECTORY_URL_KEY, `${window.location.pathname}${window.location.search}`);
}

export function getLastDirectoryUrl(): string {
  return sessionStorage.getItem(LAST_DIRECTORY_URL_KEY) ?? '/inmobiliarias';
}
