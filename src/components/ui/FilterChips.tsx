import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MapPin, Briefcase, ArrowDownAZ, Ruler, Star, Home, Tag } from 'lucide-react';

export type SortOption = 'distancia' | 'valoracion' | 'experiencia' | 'propiedades' | 'alfabetico';

const SORT_CHIPS: { value: SortOption; label: string; icon: typeof MapPin }[] = [
  { value: 'distancia', label: 'Más cercanas', icon: MapPin },
  { value: 'valoracion', label: 'Mejor valoradas', icon: Star },
  { value: 'experiencia', label: 'Mayor experiencia', icon: Briefcase },
  { value: 'propiedades', label: 'Más propiedades', icon: Home },
  { value: 'alfabetico', label: 'Alfabético', icon: ArrowDownAZ },
];

const DISTANCE_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Cualquier distancia' },
  { value: 10, label: 'Hasta 10 km' },
  { value: 25, label: 'Hasta 25 km' },
  { value: 50, label: 'Hasta 50 km' },
  { value: 100, label: 'Hasta 100 km' },
];

const chipBase =
  'flex shrink-0 items-center gap-1.5 rounded-full border px-[18px] text-[13px] font-semibold transition-[background-color,border-color,color,transform] duration-200 ease-out whitespace-nowrap h-[46px]';
const chipActive = 'border-[#FF8000] bg-[#FF8000] text-white shadow-[0_4px_14px_rgba(255,128,0,0.3)]';
const chipInactive = 'border-slate-200 bg-white text-slate-700 shadow-sm hover:border-[#FF8000] hover:bg-[#FFF4EC] hover:text-[#FF8000] active:scale-[0.97]';

function Dropdown({
  label,
  icon: Icon,
  active,
  options,
  selectedLabel,
  onSelect,
}: {
  label: string;
  icon: typeof MapPin;
  active: boolean;
  options: { value: string; label: string }[];
  selectedLabel: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`${chipBase} ${active ? chipActive : chipInactive}`}>
        <Icon size={15} /> {selectedLabel || label} <ChevronDown size={14} className="ml-0.5" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            style={{ transformOrigin: 'top left' }}
            className="absolute left-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10"
          >
            {options.map((option) => (
              <li
                key={option.value}
                onClick={() => { onSelect(option.value); setOpen(false); }}
                className={`cursor-pointer px-4 py-2.5 text-[13px] transition-colors ${
                  selectedLabel === option.label ? 'bg-[#FFF4EC] text-[#FF8000] font-semibold' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {option.label}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterChips({
  sort,
  onSortChange,
  maxDistanceKm,
  onMaxDistanceChange,
  specialties,
  selectedSpecialty,
  onSpecialtyChange,
}: {
  sort: SortOption;
  onSortChange: (s: SortOption) => void;
  maxDistanceKm: number | null;
  onMaxDistanceChange: (km: number | null) => void;
  specialties?: string[];
  selectedSpecialty?: string | null;
  onSpecialtyChange?: (specialty: string | null) => void;
}) {
  const distanceLabel = DISTANCE_OPTIONS.find((o) => o.value === maxDistanceKm)?.label ?? 'Distancia';
  const specialtyOptions = [{ value: '__all__', label: 'Cualquier especialidad' }, ...(specialties ?? []).map((s) => ({ value: s, label: s }))];

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {SORT_CHIPS.map((chip) => {
        const Icon = chip.icon;
        return (
          <button
            key={chip.value}
            type="button"
            onClick={() => onSortChange(chip.value)}
            className={`${chipBase} ${sort === chip.value ? chipActive : chipInactive}`}
          >
            <Icon size={15} /> {chip.label}
          </button>
        );
      })}

      <Dropdown
        label="Distancia"
        icon={Ruler}
        active={maxDistanceKm != null}
        options={DISTANCE_OPTIONS.map((o) => ({ value: String(o.value), label: o.label }))}
        selectedLabel={distanceLabel}
        onSelect={(v) => onMaxDistanceChange(v === 'null' ? null : Number(v))}
      />

      {specialties && specialties.length > 0 && onSpecialtyChange && (
        <Dropdown
          label="Especialidad"
          icon={Tag}
          active={!!selectedSpecialty}
          options={specialtyOptions}
          selectedLabel={selectedSpecialty ?? 'Cualquier especialidad'}
          onSelect={(v) => onSpecialtyChange(v === '__all__' ? null : v)}
        />
      )}
    </div>
  );
}
