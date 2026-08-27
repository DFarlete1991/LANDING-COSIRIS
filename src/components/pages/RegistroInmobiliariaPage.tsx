import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GoogleMap, MarkerF, useJsApiLoader } from '@react-google-maps/api';
import { ArrowRight, Check, CheckCircle2, ChevronDown, ImageIcon, Link2, Loader2, MapPin, Search, Video, Upload, X } from 'lucide-react';
import { navigateTo } from '@/lib/utils';
import { useSEO } from '@/lib/seo';
import { gmapsAvailable } from '@/lib/map-static';
import { googleMapsLoaderOptions } from '@/lib/google-maps-loader';
import { formatSpanishAddressLabel } from '@/lib/geo';
import { getAttributionFields } from '@/lib/utm';

const AVAILABLE_LANGUAGES = [
  'Español', 'Inglés', 'Francés', 'Alemán', 'Italiano', 'Portugués',
  'Catalán', 'Euskera', 'Gallego', 'Árabe', 'Chino (mandarín)',
  'Ruso', 'Neerlandés',
];

const AVAILABLE_SPECIALTIES = [
  'Compra Venta', 'Alquileres', 'Gestión de Patrimonio',
  'Alquiler Vacacional', 'Gestión de Comunidades', 'Inversión Inmobiliaria',
];

const CRM_API_URL = import.meta.env.VITE_CRM_API_URL ?? 'http://localhost:3000';
const MADRID = { lat: 40.4168, lng: -3.7038 };

const baseInputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 px-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#FF8000] focus:bg-white focus-visible:ring-2 focus-visible:ring-[#FF8000]/20 disabled:opacity-50';

type GeocodedPlace = {
  label: string;
  lat: number;
  lng: number;
  direccion: string;
  poblacion: string;
  provincia: string;
  cp: string;
};

function extractAddressParts(components: google.maps.GeocoderAddressComponent[]) {
  const find = (type: string) => components.find((c) => c.types.includes(type))?.long_name ?? '';
  const direccion = [find('route'), find('street_number')].filter(Boolean).join(' ');
  const poblacion = find('locality') || find('postal_town') || find('sublocality') || find('administrative_area_level_3');
  const provincia = find('administrative_area_level_2') || find('administrative_area_level_1');
  const cp = find('postal_code');
  return { direccion, poblacion, provincia, cp };
}

function geocoderResultToPlace(result: google.maps.GeocoderResult): GeocodedPlace {
  const parts = extractAddressParts(result.address_components);
  return {
    label: formatSpanishAddressLabel(result),
    lat: result.geometry.location.lat(),
    lng: result.geometry.location.lng(),
    ...parts,
  };
}

type ClientFormState = {
  nombre_comercial: string;
  cif: string;
  email: string;
  telefono: string;
  nombre_agente: string;
};

const emptyClientForm: ClientFormState = {
  nombre_comercial: '', cif: '', email: '', telefono: '', nombre_agente: '',
};

type Step1Phase = 'idle' | 'loading';
type SubmitPhase = 'idle' | 'loading' | 'sent';

function MultiSelectField({
  label,
  placeholder,
  options,
  values,
  onChange,
}: {
  label: string;
  placeholder: string;
  options: string[];
  values: string[];
  onChange: (v: string[]) => void;
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

  const toggle = (option: string) => {
    onChange(values.includes(option) ? values.filter((v) => v !== option) : [...values, option]);
  };

  return (
    <div ref={wrapperRef} className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-800">{label}</label>

      {values.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {values.map((v) => (
            <span key={v} className="inline-flex items-center gap-1 rounded-full bg-[#FFF4E8] px-2.5 py-1 text-xs font-medium text-[#B45309]">
              {v}
              <button type="button" onClick={() => toggle(v)} aria-label={`Quitar ${v}`}>
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`${baseInputClass} flex items-center justify-between text-left text-slate-500`}
        >
          {values.length > 0 ? `${values.length} seleccionado${values.length > 1 ? 's' : ''}` : placeholder}
          <ChevronDown size={14} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-full z-30 mt-1 max-h-56 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl"
            >
              {options.map((option) => {
                const checked = values.includes(option);
                return (
                  <li key={option}>
                    <button
                      type="button"
                      onMouseDown={(e) => { e.preventDefault(); toggle(option); }}
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${checked ? 'bg-orange-50 font-semibold text-[#FF8000]' : 'text-slate-700 hover:bg-slate-50'}`}
                    >
                      {option}
                      {checked && <Check size={14} />}
                    </button>
                  </li>
                );
              })}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ImageField({
  label,
  file,
  onChange,
  shape = 'square',
  disabled,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  shape?: 'square' | 'circle';
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-800">{label}</label>
      <div className="flex items-center gap-3">
        {previewUrl ? (
          <img src={previewUrl} alt={label} className={`h-14 w-14 shrink-0 border border-slate-200 object-cover ${shapeClass}`} />
        ) : (
          <div className={`flex h-14 w-14 shrink-0 items-center justify-center border border-dashed border-slate-300 bg-slate-50 text-slate-400 ${shapeClass}`}>
            <ImageIcon size={18} />
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#FF8000] hover:text-[#FF8000] disabled:opacity-50"
          >
            {file ? 'Cambiar' : 'Subir imagen'}
          </button>
          {file && (
            <button type="button" disabled={disabled} onClick={() => onChange(null)} className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50">
              Quitar
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        disabled={disabled}
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function VideoField({
  mode,
  onModeChange,
  file,
  onFileChange,
  link,
  onLinkChange,
  disabled,
}: {
  mode: 'file' | 'link';
  onModeChange: (m: 'file' | 'link') => void;
  file: File | null;
  onFileChange: (f: File | null) => void;
  link: string;
  onLinkChange: (v: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-800">Vídeo promocional (opcional)</label>
      <div className="flex w-fit gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
        <button
          type="button"
          onClick={() => onModeChange('file')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${mode === 'file' ? 'bg-[#FF8000] text-white' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Upload size={12} /> Subir archivo
        </button>
        <button
          type="button"
          onClick={() => onModeChange('link')}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${mode === 'link' ? 'bg-[#FF8000] text-white' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Link2 size={12} /> Pegar enlace
        </button>
      </div>

      {mode === 'file' ? (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
            <Video size={16} />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => inputRef.current?.click()}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#FF8000] hover:text-[#FF8000] disabled:opacity-50"
            >
              {file ? file.name.slice(0, 24) : 'Elegir vídeo'}
            </button>
            {file && (
              <button type="button" disabled={disabled} onClick={() => onFileChange(null)} className="text-xs text-slate-400 hover:text-red-500 disabled:opacity-50">
                Quitar
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime"
            className="hidden"
            disabled={disabled}
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>
      ) : (
        <input
          type="url"
          value={link}
          onChange={(e) => onLinkChange(e.target.value)}
          disabled={disabled}
          placeholder="https://youtube.com/watch?v=…"
          className={baseInputClass}
        />
      )}
    </div>
  );
}

function LocationField({
  place,
  onChange,
  disabled,
}: {
  place: GeocodedPlace | null;
  onChange: (place: GeocodedPlace) => void;
  disabled?: boolean;
}) {
  const hasPosition = place != null;
  const position = hasPosition ? { lat: place.lat, lng: place.lng } : MADRID;

  const { isLoaded } = useJsApiLoader(googleMapsLoaderOptions);

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const getGeocoder = () => {
    if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
    return geocoderRef.current;
  };

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeocodedPlace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3 || !isLoaded) {
      setResults([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await getGeocoder().geocode({ address: trimmed, region: 'es' });
        setResults(response.results.slice(0, 5).map(geocoderResultToPlace));
        setIsOpen(response.results.length > 0);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(timeoutId);
  }, [query, isLoaded]);

  const reverseGeocode = async (lat: number, lng: number) => {
    if (!isLoaded) return;
    try {
      const response = await getGeocoder().geocode({ location: { lat, lng } });
      const first = response.results[0];
      onChange(first ? geocoderResultToPlace(first) : { label: '', lat, lng, direccion: '', poblacion: '', provincia: '', cp: '' });
    } catch {
      onChange({ label: '', lat, lng, direccion: '', poblacion: '', provincia: '', cp: '' });
    }
  };

  if (!gmapsAvailable()) return null;

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-800">Dirección</label>

      <div ref={wrapperRef} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (results.length > 0) setIsOpen(true); }}
            disabled={disabled}
            placeholder="Busca la dirección de tu inmobiliaria..."
            className={`${baseInputClass} pl-9 pr-9`}
          />
          {isSearching && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
        </div>
        {isOpen && results.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white shadow-xl">
            {results.map((r, i) => (
              <li
                key={`${r.label}-${i}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(r);
                  setQuery(r.label);
                  setIsOpen(false);
                }}
                className="cursor-pointer px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                {r.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`relative isolate h-56 w-full overflow-hidden rounded-xl border border-slate-200 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        {isLoaded ? (
          <GoogleMap
            center={position}
            zoom={hasPosition ? 15 : 6}
            mapContainerClassName="h-full w-full"
            options={{ streetViewControl: false, mapTypeControl: false, fullscreenControl: false }}
            onClick={(e) => {
              if (e.latLng) reverseGeocode(e.latLng.lat(), e.latLng.lng());
            }}
          >
            <MarkerF
              position={position}
              draggable={!disabled}
              onDragEnd={(e) => {
                if (e.latLng) reverseGeocode(e.latLng.lat(), e.latLng.lng());
              }}
            />
          </GoogleMap>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-slate-50 text-xs text-slate-400">
            Cargando mapa…
          </div>
        )}
      </div>

      {hasPosition ? (
        <p className="flex items-start gap-1.5 text-xs text-slate-500">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <strong className="font-semibold text-slate-700">Dirección detectada:</strong>{' '}
            {[place.direccion, place.poblacion, place.provincia, place.cp].filter(Boolean).join(', ') || place.label}
          </span>
        </p>
      ) : (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          Busca tu dirección o haz clic directamente en el mapa para fijarla.
        </p>
      )}
    </div>
  );
}

export function RegistroInmobiliariaPage() {
  useSEO({
    path: '/inmobiliarias/registro',
    title: 'Regístrate como inmobiliaria y recibe leads reales | Cosiris',
    description: 'Da de alta tu inmobiliaria en el directorio de Cosiris y empieza a recibir leads reales de propietarios que quieren vender.',
  });

  const [step, setStep] = useState<1 | 2>(1);
  const [solicitudId, setSolicitudId] = useState<string | null>(null);

  const [clientForm, setClientForm] = useState<ClientFormState>(emptyClientForm);
  const [place, setPlace] = useState<GeocodedPlace | null>(null);
  const [step1Phase, setStep1Phase] = useState<Step1Phase>('idle');
  const [step1Error, setStep1Error] = useState<string | null>(null);

  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [idiomas, setIdiomas] = useState<string[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [fotoAgenteFile, setFotoAgenteFile] = useState<File | null>(null);
  const [videoMode, setVideoMode] = useState<'file' | 'link'>('link');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoLink, setVideoLink] = useState('');
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  function handleClientChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setClientForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleNextStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (step1Phase !== 'idle') return;

    if (!clientForm.nombre_comercial.trim() || !clientForm.cif.trim() || !clientForm.email.trim()) {
      setStep1Error('Nombre comercial, CIF y email son obligatorios.');
      return;
    }
    if (!place) {
      setStep1Error('Fija la dirección de tu inmobiliaria en el mapa para continuar.');
      return;
    }

    setStep1Error(null);
    setStep1Phase('loading');

    try {
      const body = new FormData();
      for (const [key, value] of Object.entries(clientForm)) body.append(key, value);
      body.append('direccion', place.direccion);
      body.append('poblacion', place.poblacion);
      body.append('provincia', place.provincia);
      body.append('cp', place.cp);
      body.append('lat', String(place.lat));
      body.append('lng', String(place.lng));
      for (const [key, value] of Object.entries(getAttributionFields())) body.append(key, value);

      const response = await fetch(`${CRM_API_URL}/api/public/registro-inmobiliaria`, {
        method: 'POST',
        body,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setStep1Error(data?.error ?? 'No se pudo guardar tus datos. Inténtalo de nuevo.');
        setStep1Phase('idle');
        return;
      }

      setSolicitudId(data?.id ?? null);
      setStep1Phase('idle');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Aviso a GTM del paso 1 completado (lead parcial), aunque no cambie
      // la URL — este formulario manda los datos a otro proyecto (CRM) y no
      // hay recarga ni pushState que GTM pueda detectar por sí solo.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'registro_inmobiliaria_paso1', solicitud_id: data?.id ?? null });
    } catch {
      setStep1Error('Error de conexión. Comprueba tu internet e inténtalo de nuevo.');
      setStep1Phase('idle');
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase !== 'idle' || !solicitudId) return;

    setError(null);
    setPhase('loading');

    try {
      const body = new FormData();
      body.append('id', solicitudId);
      body.append('especialidades', JSON.stringify(especialidades));
      body.append('idiomas', JSON.stringify(idiomas));
      if (logoFile) body.append('logo', logoFile);
      if (fotoAgenteFile) body.append('foto_agente', fotoAgenteFile);
      if (videoMode === 'file' && videoFile) body.append('video', videoFile);
      if (videoMode === 'link' && videoLink.trim()) body.append('video_link', videoLink.trim());

      // No se pone Content-Type a mano: el navegador arma el boundary del
      // multipart/form-data solo, si lo forzamos se rompe el parseo en el servidor.
      const response = await fetch(`${CRM_API_URL}/api/public/registro-inmobiliaria`, {
        method: 'PATCH',
        body,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.error ?? 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
        setPhase('idle');
        return;
      }

      setPhase('sent');

      // Igual que en el paso 1: sin esto GTM no se entera de que la
      // solicitud se completó, porque no hay recarga ni cambio de URL.
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ event: 'registro_inmobiliaria_completado', solicitud_id: solicitudId });
    } catch {
      setError('Error de conexión. Comprueba tu internet e inténtalo de nuevo.');
      setPhase('idle');
    }
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      {/* Panel izquierdo — marca */}
      <section className="relative h-full w-full overflow-hidden bg-slate-900 px-8 py-10 text-white sm:px-10 sm:py-12 md:flex md:flex-col md:justify-between">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,128,0,0.22),transparent_55%),radial-gradient(circle_at_80%_75%,rgba(255,128,0,0.18),transparent_45%)]" />

        <div className="relative z-10">
          <button type="button" onClick={() => navigateTo('/')} className="inline-block">
            <img src="/assets/logo_orange.png" alt="Cosiris" className="h-16 w-auto sm:h-20" />
          </button>
          <p className="mt-8 max-w-md text-sm font-medium uppercase tracking-[0.18em] text-slate-300">
            Directorio de Inmobiliarias
          </p>
          <h1 className="mt-4 max-w-lg text-4xl font-extrabold leading-[1.05] text-white xl:text-5xl">
            Regístrate y empieza a recibir leads reales.
          </h1>
          <p className="mt-5 max-w-md text-base text-slate-300">
            30 días de prueba gratis: tu inmobiliaria aparece en el directorio público y ves tus leads
            directamente en el CRM de Cosiris.
          </p>
        </div>

        <div className="relative z-10 mt-8 grid gap-3 text-sm text-slate-200 md:mt-0">
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/65 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF8000]" />
            Sin tarjeta de crédito
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/65 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF8000]" />
            Aprobación en 24–48 horas
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/65 px-3 py-2">
            <CheckCircle2 className="h-4 w-4 text-[#FF8000]" />
            Panel con tus leads en tiempo real
          </div>
        </div>
      </section>

      {/* Panel derecho — formulario */}
      <section className="flex h-full w-full items-center justify-center bg-white px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait">
            {phase === 'sent' ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center py-8 text-center"
              >
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 border-[#FF8000]">
                  <Check size={28} strokeWidth={2.5} className="text-[#FF8000]" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900">Solicitud enviada</h2>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
                  Tu cuenta será validada y tendrás acceso en 24–48 horas si tu solicitud fue aprobada.
                  Te avisaremos por email a <strong>{clientForm.email}</strong>.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('/inmobiliarias')}
                  className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#FF8000] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#E67300]"
                >
                  Volver al directorio
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }}>
                <div className="mb-6 space-y-3">
                  <img src="/assets/logo_orange.png" alt="Cosiris" className="h-9 w-auto" />
                  <h2 className="text-2xl font-extrabold leading-tight text-slate-900">Registra tu inmobiliaria</h2>
                  <p className="text-sm text-slate-600">
                    {step === 1 ? 'Cuéntanos quién eres — los revisamos y te avisamos por correo.' : 'Ahora completa el perfil que verán tus futuros leads.'}
                  </p>
                  <div className="flex items-center gap-2">
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-[#FF8000]' : 'bg-slate-200'}`} />
                    <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-[#FF8000]' : 'bg-slate-200'}`} />
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {step === 1 ? (
                    <motion.form
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleNextStep}
                      noValidate
                      className="space-y-4"
                    >
                      <div className="space-y-1.5">
                        <label htmlFor="ri-nombre" className="block text-sm font-semibold text-slate-800">Nombre comercial</label>
                        <input id="ri-nombre" name="nombre_comercial" value={clientForm.nombre_comercial} onChange={handleClientChange} disabled={step1Phase === 'loading'} placeholder="Ej. Inmobiliaria García" className={baseInputClass} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="ri-cif" className="block text-sm font-semibold text-slate-800">CIF</label>
                          <input id="ri-cif" name="cif" value={clientForm.cif} onChange={handleClientChange} disabled={step1Phase === 'loading'} placeholder="B12345678" className={baseInputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="ri-agente" className="block text-sm font-semibold text-slate-800">Persona de contacto</label>
                          <input id="ri-agente" name="nombre_agente" value={clientForm.nombre_agente} onChange={handleClientChange} disabled={step1Phase === 'loading'} placeholder="Tu nombre" className={baseInputClass} />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label htmlFor="ri-email" className="block text-sm font-semibold text-slate-800">Email</label>
                          <input id="ri-email" name="email" type="email" value={clientForm.email} onChange={handleClientChange} disabled={step1Phase === 'loading'} placeholder="tu@empresa.com" className={baseInputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <label htmlFor="ri-telefono" className="block text-sm font-semibold text-slate-800">Teléfono</label>
                          <input id="ri-telefono" name="telefono" type="tel" value={clientForm.telefono} onChange={handleClientChange} disabled={step1Phase === 'loading'} placeholder="671 355 775" className={baseInputClass} />
                        </div>
                      </div>

                      <LocationField place={place} onChange={setPlace} disabled={step1Phase === 'loading'} />

                      {step1Error && <p className="text-sm text-red-500">{step1Error}</p>}

                      <div className="pt-1">
                        <button
                          type="submit"
                          disabled={step1Phase === 'loading'}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF8000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {step1Phase === 'loading' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Guardando…
                            </>
                          ) : (
                            <>
                              Siguiente
                              <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleSubmit}
                      noValidate
                      className="space-y-4"
                    >
                      <div>
                        <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                          Fotos y vídeo — se usan para tu perfil público
                        </p>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <ImageField label="Logo de la inmobiliaria" file={logoFile} onChange={setLogoFile} shape="square" disabled={phase === 'loading'} />
                            <ImageField label="Foto del agente / dueño" file={fotoAgenteFile} onChange={setFotoAgenteFile} shape="circle" disabled={phase === 'loading'} />
                          </div>
                          <VideoField
                            mode={videoMode}
                            onModeChange={setVideoMode}
                            file={videoFile}
                            onFileChange={setVideoFile}
                            link={videoLink}
                            onLinkChange={setVideoLink}
                            disabled={phase === 'loading'}
                          />
                        </div>
                      </div>

                      <MultiSelectField label="Especialidades (opcional)" placeholder="Selecciona tus especialidades" options={AVAILABLE_SPECIALTIES} values={especialidades} onChange={setEspecialidades} />
                      <MultiSelectField label="Idiomas (opcional)" placeholder="Selecciona los idiomas que hablas" options={AVAILABLE_LANGUAGES} values={idiomas} onChange={setIdiomas} />

                      {error && <p className="text-sm text-red-500">{error}</p>}

                      <div className="flex gap-3 pt-1">
                        <button
                          type="button"
                          disabled={phase === 'loading'}
                          onClick={() => setStep(1)}
                          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                        >
                          Volver
                        </button>
                        <button
                          type="submit"
                          disabled={phase === 'loading'}
                          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#FF8000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {phase === 'loading' ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Enviando…
                            </>
                          ) : (
                            'Enviar solicitud'
                          )}
                        </button>
                      </div>

                      <p className="text-center text-xs text-slate-400">
                        Al enviar aceptas que revisemos tu solicitud antes de activar tu cuenta.
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
