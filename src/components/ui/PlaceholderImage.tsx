import { Building2, ImageIcon, User } from 'lucide-react';

// Bloque de imagen placeholder, claramente identificable, para slots
// donde falta una fotografía/logo real (ciudades, inmobiliarias, hero, personas).
// Reemplazar por <img> real cuando existan los assets.
export function PlaceholderImage({
  label,
  className = '',
  icon = 'image',
}: {
  label?: string;
  className?: string;
  icon?: 'image' | 'building' | 'person';
}) {
  const Icon = icon === 'building' ? Building2 : icon === 'person' ? User : ImageIcon;

  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-slate-100 via-slate-100 to-slate-200 text-slate-400 ${className}`}
    >
      <Icon size={26} strokeWidth={1.5} />
      {label && <span className="px-2 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</span>}
    </div>
  );
}
