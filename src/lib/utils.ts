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
