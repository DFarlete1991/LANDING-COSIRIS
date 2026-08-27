import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BadgeCheck, Check, Clock, Home, Loader2, MapPin, ShieldCheck, Star } from 'lucide-react';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Footer } from '../Footer';
import { LandingNavbar } from './landing-navbar';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { navigateTo } from '@/lib/utils';
import { useSEO } from '@/lib/seo';
import { useValidImageUrl } from '@/lib/use-valid-image-url';
import { haversineKm } from '@/lib/geo';
import { getAttributionFields, getAttributionSummaryLine } from '@/lib/utm';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

const EXPO = [0.19, 1, 0.22, 1] as const;

const inputClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

type Motivo = 'Cambio de vivienda' | 'Herencia' | 'Separación o divorcio' | 'Problemas económicos' | 'Otro' | '';
const MOTIVOS: Motivo[] = ['Cambio de vivienda', 'Herencia', 'Separación o divorcio', 'Problemas económicos', 'Otro'];

type Tiempo = 'Aún no la he puesto a la venta.' | 'Ya se la he dado a otras inmobiliarias.' | 'La tengo anunciada como particular.' | 'Lleva más de 3 meses a la venta y no se ha vendido.' | '';
const TIEMPOS: Tiempo[] = [
  'Aún no la he puesto a la venta.',
  'Ya se la he dado a otras inmobiliarias.',
  'La tengo anunciada como particular.',
  'Lleva más de 3 meses a la venta y no se ha vendido.',
];

type Phase = 'form' | 'select' | 'sending' | 'sent' | 'error';

type ZoneDetails = { postalCode?: string; city?: string; province?: string; lat?: number; lng?: number };

// El CRM es quien crea el lead real por inmobiliaria (mismo endpoint público
// que usa AgencyLeadForm en el perfil de cada agencia). Si el usuario elige
// varias inmobiliarias se crea un lead por cada una, etiquetadas con el mismo
// tipo_origen para que el admin pueda distinguir de dónde vienen.
const CRM_API_URL = import.meta.env.VITE_CRM_API_URL ?? 'http://localhost:3000';

// Mismo radio que usa el listado del directorio (InmobiliariasResultsView),
// para que "tu zona" signifique lo mismo en todo el sitio.
const MAX_ZONE_DISTANCE_KM = 50;

// Coincide las inmobiliarias realmente cercanas a la dirección introducida,
// usando distancia real (haversine) — igual que el buscador principal del
// directorio — en vez de comparar texto de CP/ciudad/provincia: ese método
// podía matchear inmobiliarias lejanas por una coincidencia parcial de
// provincia. Si el geocoder no devolvió coordenadas, cae al match por texto.
function matchAgenciesInZone(agencies: InmobiliariaPublica[], zone: ZoneDetails): InmobiliariaPublica[] {
  if (zone.lat != null && zone.lng != null) {
    const point = { lat: zone.lat, lng: zone.lng };
    return agencies
      .filter((a) => a.lat != null && a.lng != null)
      .map((a) => ({ agency: a, km: haversineKm(point, { lat: a.lat as number, lng: a.lng as number }) }))
      .filter((s) => s.km <= MAX_ZONE_DISTANCE_KM)
      .sort((a, b) => a.km - b.km)
      .slice(0, 4)
      .map((s) => s.agency);
  }

  const cp = zone.postalCode?.replace(/\D/g, '') ?? '';
  const cp3 = cp.slice(0, 3);
  const cp2 = cp.slice(0, 2);
  const norm = (s?: string) => (s ?? '').trim().toLowerCase().normalize('NFC');

  const scored = agencies.map((a) => {
    const aCp = (a.cp ?? '').replace(/\D/g, '');
    const aCity = norm(a.poblacion);
    const aProv = norm(a.provincia);
    const zoneCity = norm(zone.city);
    const zoneProvince = norm(zone.province);

    let score = 0;
    if (cp3 && aCp.startsWith(cp3)) score += 4;
    else if (cp2 && aCp.startsWith(cp2)) score += 2;
    if (zoneCity && (aCity.includes(zoneCity) || zoneCity.includes(aCity))) score += 3;
    if (zoneProvince && aProv.includes(zoneProvince)) score += 1;
    return { agency: a, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((s) => s.agency);
}

async function submitAgencyLead(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${CRM_API_URL}/api/public/portal-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return { ok: true };
    const data = await response.json().catch(() => null);
    return { ok: false, error: data?.error ?? 'No se pudo enviar la solicitud.' };
  } catch {
    return { ok: false, error: 'Error de conexión con el CRM.' };
  }
}

function MinimalAgencyCard({
  agency,
  selected,
  onToggle,
}: {
  agency: InmobiliariaPublica;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  const filledStars = agency.rating != null ? Math.min(5, Math.round(agency.rating)) : 0;
  const fotoUrl = useValidImageUrl(agency.foto_url);
  const logoUrl = useValidImageUrl(agency.logo_url);
  return (
    <button
      type="button"
      onClick={() => onToggle(agency.id)}
      aria-pressed={selected}
      className={`relative flex flex-col rounded-2xl border p-4 text-left shadow-sm transition-[border-color,background-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000] ${
        selected
          ? 'border-[#FF8000] bg-orange-50/60 ring-2 ring-[#FF8000]/15'
          : 'border-slate-200 bg-white hover:border-[#FF8000]/40 hover:shadow-md hover:shadow-[#FF8000]/5'
      }`}
    >
      <span
        className={`absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
          selected ? 'border-[#FF8000] bg-[#FF8000] text-white' : 'border-slate-300 bg-white text-transparent'
        }`}
      >
        <Check size={13} strokeWidth={3} />
      </span>

      <div className="flex items-center gap-3 pr-7">
        {fotoUrl ? (
          <img
            src={fotoUrl}
            alt={agency.nombre_agente}
            style={{ objectPosition: agency.foto_pos ?? '50% 50%' }}
            className="h-11 w-11 shrink-0 rounded-full border border-slate-100 object-cover"
          />
        ) : logoUrl ? (
          <img
            src={logoUrl}
            alt={agency.nombre_comercial}
            style={{ objectPosition: agency.logo_pos ?? '50% 50%' }}
            className="h-11 w-11 shrink-0 rounded-xl border border-slate-100 object-cover"
          />
        ) : (
          <div
            style={{ backgroundColor: agency.color_hex }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base font-black text-white"
          >
            {agency.nombre_comercial.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-bold text-slate-900">
            {agency.nombre_comercial}
            <BadgeCheck size={14} className="shrink-0 text-[#FF8000]" aria-label="Cliente verificado" />
          </p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-slate-500">
            <MapPin size={11} className="shrink-0" /> {agency.poblacion}, {agency.provincia}
          </p>
        </div>
      </div>

      {agency.rating != null && (
        <div className="mt-3 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={11} className={i < filledStars ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'} />
          ))}
          <span className="ml-1 text-[11px] font-bold text-slate-900">{agency.rating}</span>
          {agency.num_opiniones != null && (
            <span className="text-[11px] text-slate-400">({agency.num_opiniones})</span>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2.5 text-[11px] font-medium text-slate-600">
        {agency.anos_experiencia > 0 && (
          <span className="flex items-center gap-1">
            <Clock size={12} className="shrink-0 text-[#FF8000]" /> {agency.anos_experiencia} años
          </span>
        )}
        {agency.num_propiedades > 0 && (
          <span className="flex items-center gap-1">
            <Home size={12} className="shrink-0 text-[#FF8000]" /> {agency.num_propiedades} propiedades
          </span>
        )}
      </div>
    </button>
  );
}

export function ValorarPropiedadPage() {
  useSEO({
    path: '/inmobiliarias/valorar',
    title: 'Valora tu propiedad gratis | Cosiris',
    description: 'Solicita la valoración gratuita de tu propiedad y te ponemos en contacto con la inmobiliaria verificada más cercana.',
  });

  const { agencies } = useInmobiliarias();

  const [phase, setPhase] = useState<Phase>('form');
  const [step, setStep] = useState(1);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [zone, setZone] = useState<ZoneDetails>({});
  const [motivo, setMotivo] = useState<Motivo>('');
  const [tiempo, setTiempo] = useState<Tiempo>('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState('');

  const [matched, setMatched] = useState<InmobiliariaPublica[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current !== null) window.clearTimeout(autoAdvanceTimerRef.current);
    };
  }, []);

  const advanceAfter = (next: number) => {
    if (isAutoAdvancing) return;
    setIsAutoAdvancing(true);
    autoAdvanceTimerRef.current = window.setTimeout(() => {
      setStep(next);
      setIsAutoAdvancing(false);
    }, 280);
  };

  const handleNextPhase1 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = 'La dirección es obligatoria.';
    // Sin coordenadas reales (solo se obtienen al elegir una sugerencia del
    // autocompletado) el match de inmobiliarias cercanas cae a un método por
    // texto mucho menos fiable — mejor exigir una dirección real seleccionada
    // que dejar pasar una escrita a mano y sin geocodificar.
    else if (zone.lat == null || zone.lng == null) errs.address = 'Selecciona una dirección de la lista de sugerencias.';
    if (!postalCode.trim() || !/^\d{5}$/.test(postalCode)) errs.postalCode = 'C.P. debe tener 5 dígitos.';
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});
    setStep(2);
  };

  const handleContactSubmit = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Introduce tu nombre.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Introduce un email válido.';
    if (!phone.trim() || !/^[+]?[\d\s]{9,15}$/.test(phone)) errs.phone = 'Introduce un teléfono válido.';
    if (Object.keys(errs).length > 0) return setErrors(errs);

    setErrors({});
    const candidates = matchAgenciesInZone(agencies, {
      postalCode,
      city: zone.city,
      province: zone.province,
      lat: zone.lat,
      lng: zone.lng,
    });
    setMatched(candidates);
    setSelected(candidates.length > 0 ? [candidates[0].id] : []);
    setPhase('select');
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const toggleAgency = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    setSelected(selected.length === matched.length ? [] : matched.map((a) => a.id));
  };

  const selectedAgencies = useMemo(() => matched.filter((a) => selected.includes(a.id)), [matched, selected]);

  const handleSend = async () => {
    if (selectedAgencies.length === 0) return;
    setErrorMessage('');
    setPhase('sending');

    const mensaje = [
      getAttributionSummaryLine(),
      `Dirección: ${address} (CP ${postalCode})`,
      motivo && `Motivo de venta: ${motivo}`,
      tiempo && `Tiempo intentando vender: ${tiempo}`,
    ].filter(Boolean).join('\n');

    const results = await Promise.all(
      selectedAgencies.map((agency) =>
        submitAgencyLead({
          client_id: agency.id,
          nombre: name,
          telefono: phone || null,
          email: email || null,
          mensaje,
          direccion: address,
          cp: postalCode,
          motivo: motivo || null,
          tiempo: tiempo || null,
          tipo_origen: 'Portal Inmobiliarias',
          ...getAttributionFields(),
        }),
      ),
    );

    if (results.every((r) => r.ok)) {
      setPhase('sent');
    } else {
      setErrorMessage(results.find((r) => !r.ok)?.error ?? 'No se pudo enviar la solicitud.');
      setPhase('error');
    }
  };

  const progress = ((step - 1) / 4) * 100;

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar invertOnScroll />

      <header className="relative overflow-hidden bg-[#0F172A]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,128,0,0.14),transparent_55%)]" />
        <div className="relative mx-auto w-full max-w-[1400px] px-6 py-14 sm:py-16">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">Portal Inmobiliarias · Cosiris</p>
          <h1 className="mt-2.5 text-[30px] font-black leading-[1.1] tracking-[-0.02em] text-white sm:text-[40px]">
            Valora tu propiedad gratis
          </h1>
          <p className="mt-3 max-w-xl text-sm text-white/85 sm:text-base">
            Cuéntanos dónde está tu vivienda y las inmobiliarias de tu zona recibirán tu solicitud automáticamente. Sin compromiso.
          </p>
        </div>
      </header>

      <main>
        {phase === 'sent' ? (
          <div className="mx-auto w-full max-w-lg px-4 pb-24 pt-16 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-100 bg-orange-50">
              <Check size={32} strokeWidth={2.5} className="text-[#FF8000]" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">¡Solicitud enviada!</h2>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-600">
              Hemos enviado tu valoración a {selectedAgencies.length} {selectedAgencies.length === 1 ? 'inmobiliaria' : 'inmobiliarias'} de tu zona. Te contactarán en breve.
            </p>
            <button
              type="button"
              onClick={() => navigateTo('/inmobiliarias')}
              className="mt-8 inline-flex items-center justify-center gap-2 rounded-full bg-[#FF8000] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#E67300] active:scale-[0.98]"
            >
              Volver al directorio
              <ArrowRight size={16} />
            </button>
          </div>
        ) : phase === 'select' || phase === 'sending' ? (
          <div className="mx-auto w-full max-w-[960px] px-6 pb-16 pt-10 sm:pt-14">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF8000]">Elige tu inmobiliaria</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {matched.length > 0
                ? '¿A quién quieres que valore tu propiedad?'
                : 'No hay inmobiliarias en tu zona todavía'}
            </h2>
            <p className="mt-2 flex items-start gap-1.5 text-sm text-slate-500">
              <MapPin size={14} className="mt-0.5 shrink-0 text-[#FF8000]" />
              {address} (CP {postalCode})
            </p>

            {matched.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                <p className="text-sm text-slate-600">
                  Todavía no hay inmobiliarias registradas en tu sector, pero puedes buscarlas en el directorio de tu zona.
                </p>
                <button
                  type="button"
                  onClick={() => navigateTo('/inmobiliarias')}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FF8000] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#E67300] active:scale-95"
                >
                  Buscar inmobiliarias
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <>
                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-500">
                    Selecciona una o varias · {selected.length} {selected.length === 1 ? 'elegida' : 'elegidas'}
                  </p>
                  <button
                    type="button"
                    onClick={toggleSelectAll}
                    disabled={phase === 'sending'}
                    className="text-xs font-bold text-[#FF8000] hover:text-[#E67300]"
                  >
                    {selected.length === matched.length ? 'Quitar todas' : 'Seleccionar todas'}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {matched.map((agency) => (
                    <MinimalAgencyCard
                      key={agency.id}
                      agency={agency}
                      selected={selected.includes(agency.id)}
                      onToggle={toggleAgency}
                    />
                  ))}
                </div>

                <AnimatePresence>
                  {errorMessage && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 text-xs text-red-500">
                      {errorMessage}
                    </motion.p>
                  )}
                </AnimatePresence>

                <div className="sticky bottom-0 -mx-6 mt-8 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => { setPhase('form'); setStep(4); }}
                      disabled={phase === 'sending'}
                      className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      Volver
                    </button>
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={selected.length === 0 || phase === 'sending'}
                      className="flex flex-1 items-center justify-center gap-2 rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phase === 'sending' ? (
                        <>
                          <Loader2 size={18} className="animate-spin" /> Enviando solicitud…
                        </>
                      ) : (
                        <>
                          Enviar solicitud a {selected.length} {selected.length === 1 ? 'inmobiliaria' : 'inmobiliarias'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="mx-auto w-full max-w-lg px-4 pb-20 pt-10 sm:pt-14">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-[#FF8000]">Valora tu propiedad gratis</span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {step === 1 ? 'Dirección del inmueble' : step === 2 ? '¿Cuál es el motivo principal de la venta?' : step === 3 ? '¿Cuánto tiempo llevas intentando vender?' : 'Datos de contacto'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Sin compromiso · Las inmobiliarias de tu zona reciben tu solicitud automáticamente.
            </p>

            <div className="mt-5 h-1.5 rounded-full bg-slate-100">
              <motion.div className="h-full rounded-full bg-[#FF8000]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.4, ease: EXPO }} />
            </div>

            <div className="mt-7">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Dirección</label>
                      <AddressAutocomplete
                        value={address}
                        onChange={setAddress}
                        error={Boolean(errors.address)}
                        onSelectDetails={(details) => {
                          if (details.postalCode) setPostalCode(details.postalCode);
                          setZone({
                            postalCode: details.postalCode,
                            city: details.city,
                            province: details.province,
                            lat: details.lat,
                            lng: details.lng,
                          });
                        }}
                      />
                      {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Código Postal</label>
                      <input
                        type="text"
                        maxLength={5}
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))}
                        className={`${inputClass} ${errors.postalCode ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                      />
                      {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={handleNextPhase1}
                      className="group flex w-full items-center justify-center gap-2 rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300] active:scale-[0.99]"
                    >
                      Siguiente
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      {MOTIVOS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          disabled={isAutoAdvancing}
                          onClick={() => { setMotivo(r); setErrors({}); advanceAfter(3); }}
                          className={`rounded-md border px-4 py-4 text-left text-sm font-semibold transition-all ${
                            motivo === r ? 'border-[#FF8000] bg-orange-50 text-[#FF8000] ring-1 ring-[#FF8000]/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setStep(1)} disabled={isAutoAdvancing} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Volver</button>
                  </motion.div>
                ) : step === 3 ? (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-3">
                    <div className="flex flex-col gap-3">
                      {TIEMPOS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          disabled={isAutoAdvancing}
                          onClick={() => { setTiempo(t); setErrors({}); advanceAfter(4); }}
                          className={`rounded-md border px-4 py-4 text-left text-sm font-semibold transition-all ${
                            tiempo === t ? 'border-[#FF8000] bg-orange-50 text-[#FF8000] ring-1 ring-[#FF8000]/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <button type="button" onClick={() => setStep(2)} disabled={isAutoAdvancing} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Volver</button>
                  </motion.div>
                ) : (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }} className="space-y-4">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Nombre completo</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold text-slate-700">Teléfono</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        Volver
                      </button>
                      <button
                        type="button"
                        onClick={handleContactSubmit}
                        className="flex flex-1 items-center justify-center rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300]"
                      >
                        Continuar
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] font-medium text-slate-400">
              <ShieldCheck size={13} className="text-[#FF8000]" />
              Tus datos solo se comparten con las inmobiliarias que elijas.
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
