// Helpers para tematizar el perfil público de cada inmobiliaria con su
// color_hex (elegido en el CRM) — ver CSS custom properties
// --color-primary-rgb / --color-primary-hover-rgb en index.css y
// tailwind.config.js (theme.colors.primary usa esas variables).
import type { CSSProperties } from 'react';

const FALLBACK_RGB = '255 128 0'; // #FF8000, mismo naranja de siempre

/** "#FF8000" -> "255 128 0" (formato que espera rgb(var(--x) / <alpha>)). */
export function hexToRgbTriplet(hex: string | null | undefined): string {
  if (!hex) return FALLBACK_RGB;
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return FALLBACK_RGB;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `${r} ${g} ${b}`;
}

/** Versión oscurecida de un hex, para el estado :hover del color principal. */
export function darkenHex(hex: string | null | undefined, amount = 0.14): string {
  if (!hex) return '#E67300';
  const clean = hex.trim().replace('#', '');
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean;
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return '#E67300';
  const num = parseInt(full, 16);
  const channel = (shift: number) => {
    const value = (num >> shift) & 255;
    return Math.max(0, Math.round(value * (1 - amount)));
  };
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(channel(16))}${toHex(channel(8))}${toHex(channel(0))}`;
}

/** CSS custom properties para inyectar en el elemento raíz del perfil de una
    inmobiliaria — de ahí en adelante, cualquier clase bg-primary/text-primary/
    border-primary/etc. dentro de ese árbol usa el color de esa inmobiliaria. */
export function agencyThemeStyle(colorHex: string | null | undefined): CSSProperties {
  return {
    '--color-primary-rgb': hexToRgbTriplet(colorHex),
    '--color-primary-hover-rgb': hexToRgbTriplet(darkenHex(colorHex)),
  } as CSSProperties;
}
