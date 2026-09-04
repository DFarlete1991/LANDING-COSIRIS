import Select from 'react-select';
import {
  ES, CO, MX, AR, CL, PE, EC, VE, UY, BO,
  PY, PA, CR, DO, US, GB, FR, DE, IT, PT,
} from 'country-flag-icons/react/3x2';
import { COUNTRY_CODES, type CountryCode } from '@/data/country-codes';

// Se importan las banderas una a una, y NO con `import * as Flags`: el
// namespace + el acceso dinámico FLAG_COMPONENTS[iso] impedía a Rollup
// descartar nada, así que las ~250 banderas del paquete (230 kB) acababan en
// el bundle principal de TODAS las rutas por culpa de este único combobox.
// Aquí solo entran las 20 de COUNTRY_CODES — si se añade un país a esa lista,
// hay que añadir su ISO también aquí o se quedará sin bandera.
// El tipo se toma de una bandera cualquiera: el paquete define su propio
// FlagComponent (sobre HTMLSVGElement) que no encaja con React.SVGProps.
const FLAG_COMPONENTS: Record<string, typeof ES> = {
  ES, CO, MX, AR, CL, PE, EC, VE, UY, BO,
  PY, PA, CR, DO, US, GB, FR, DE, IT, PT,
};

function CountryOptionLabel({ country }: { country: CountryCode }) {
  const Flag = FLAG_COMPONENTS[country.iso];
  return (
    <span className="flex items-center gap-2">
      {Flag && <Flag className="h-3.5 w-5 shrink-0 rounded-[2px]" />}
      <span className="truncate">{country.name}</span>
      <span className="opacity-60">{country.dial}</span>
    </span>
  );
}

type CountryCodeSelectProps = {
  value: string;
  onChange: (dial: string) => void;
  id?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
};

// Combobox de indicativo de país: escribe para filtrar por nombre, ISO o
// código, con bandera. Envuelve react-select para no reinventar el manejo
// de teclado/accesibilidad de un combobox.
export function CountryCodeSelect({ value, onChange, id, ariaLabel, disabled, className = '' }: CountryCodeSelectProps) {
  const selected = COUNTRY_CODES.find((country) => country.dial === value) ?? null;

  return (
    <Select<CountryCode, false>
      inputId={id}
      aria-label={ariaLabel}
      isDisabled={disabled}
      unstyled
      options={COUNTRY_CODES}
      value={selected}
      onChange={(option) => option && onChange(option.dial)}
      getOptionValue={(country) => country.iso}
      getOptionLabel={(country) => `${country.name} ${country.dial} ${country.iso}`}
      formatOptionLabel={(country) => <CountryOptionLabel country={country} />}
      placeholder=""
      className={className}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : undefined}
      styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
      classNames={{
        control: ({ isFocused }) =>
          `flex items-center rounded-md border bg-slate-50 px-2 py-2 text-sm transition-all ${isFocused ? 'border-[#FF8000] bg-white ring-4 ring-[#FF8000]/15' : 'border-slate-200'}`,
        valueContainer: () => 'gap-1',
        menu: () => 'mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl',
        menuList: () => 'max-h-60 overflow-y-auto py-1',
        option: ({ isFocused, isSelected }) =>
          `cursor-pointer px-3 py-2 text-sm ${isSelected ? 'bg-orange-50 font-semibold text-[#FF8000]' : isFocused ? 'bg-slate-50 text-slate-700' : 'text-slate-700'}`,
        singleValue: () => 'text-slate-900',
        input: () => 'text-slate-900',
        indicatorSeparator: () => 'hidden',
        dropdownIndicator: () => 'text-slate-400 px-1',
        noOptionsMessage: () => 'px-3 py-2 text-sm text-slate-400',
      }}
    />
  );
}
