export type CountryCode = {
  iso: string;
  name: string;
  dial: string;
};

// España primero (mercado principal), luego Latinoamérica y el resto por
// nombre — cubre los países donde Cosiris capta leads hoy.
export const COUNTRY_CODES: CountryCode[] = [
  { iso: 'ES', name: 'España', dial: '+34' },
  { iso: 'CO', name: 'Colombia', dial: '+57' },
  { iso: 'MX', name: 'México', dial: '+52' },
  { iso: 'AR', name: 'Argentina', dial: '+54' },
  { iso: 'CL', name: 'Chile', dial: '+56' },
  { iso: 'PE', name: 'Perú', dial: '+51' },
  { iso: 'EC', name: 'Ecuador', dial: '+593' },
  { iso: 'VE', name: 'Venezuela', dial: '+58' },
  { iso: 'UY', name: 'Uruguay', dial: '+598' },
  { iso: 'BO', name: 'Bolivia', dial: '+591' },
  { iso: 'PY', name: 'Paraguay', dial: '+595' },
  { iso: 'PA', name: 'Panamá', dial: '+507' },
  { iso: 'CR', name: 'Costa Rica', dial: '+506' },
  { iso: 'DO', name: 'Rep. Dominicana', dial: '+1809' },
  { iso: 'US', name: 'Estados Unidos', dial: '+1' },
  { iso: 'GB', name: 'Reino Unido', dial: '+44' },
  { iso: 'FR', name: 'Francia', dial: '+33' },
  { iso: 'DE', name: 'Alemania', dial: '+49' },
  { iso: 'IT', name: 'Italia', dial: '+39' },
  { iso: 'PT', name: 'Portugal', dial: '+351' },
];

export const DEFAULT_COUNTRY_DIAL = '+34';

// Combina el indicativo con el número tal como lo escribió el usuario, en
// formato E.164-ish (sin espacios) para que el bot de WhatsApp lo reciba listo.
export function toInternationalPhone(dial: string, localPhone: string): string {
  const digits = localPhone.replace(/\D/g, '');
  return `${dial}${digits}`;
}
