import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { FormNavbar } from '../ui/form-navbar';
import { SharedLandingSections } from '../ui/shared-landing-sections';
import { useSEO } from '@/lib/seo';
import { getAttributionFields } from '@/lib/utm';
import { notifyWhatsAppLead } from '@/lib/whatsapp-webhook';
import { DEFAULT_COUNTRY_DIAL, toInternationalPhone } from '@/data/country-codes';
import { CountryCodeSelect } from '../ui/CountryCodeSelect';
import { ConsentCheckbox } from '../ui/ConsentCheckbox';

const PROVINCES = [
  'Álava', 'Albacete', 'Alicante', 'Almería', 'Asturias', 'Ávila',
  'Badajoz', 'Barcelona', 'Bizkaia', 'Burgos', 'Cáceres', 'Cádiz',
  'Cantabria', 'Castellón', 'Ciudad Real', 'Córdoba', 'Cuenca',
  'Gipuzkoa', 'Girona', 'Granada', 'Guadalajara', 'Huelva', 'Huesca',
  'Islas Baleares', 'Jaén', 'La Coruña', 'La Rioja', 'Las Palmas',
  'León', 'Lleida', 'Lugo', 'Madrid', 'Málaga', 'Murcia', 'Navarra',
  'Ourense', 'Palencia', 'Pontevedra', 'Salamanca',
  'Santa Cruz de Tenerife', 'Segovia', 'Sevilla', 'Soria', 'Tarragona',
  'Teruel', 'Toledo', 'Valencia', 'Valladolid', 'Zamora', 'Zaragoza',
];

const SERVICE_OPTIONS = ['Gestión Redes', 'Captación Ads', 'Email Marketing', 'Agente IA'];

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

const baseInputClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

type SubmitPhase = 'idle' | 'loading' | 'sent';

type FormData = {
  name: string;
  email: string;
  countryCode: string;
  phone: string;
  province: string;
  employees: string;
};

type FormErrors = Record<keyof FormData, string>;

const emptyForm: FormData = { name: '', email: '', countryCode: DEFAULT_COUNTRY_DIAL, phone: '', province: '', employees: '' };
const emptyErrors: FormErrors = { name: '', email: '', countryCode: '', phone: '', province: '', employees: '' };

function ProvinceField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (value: string) => void;
  error: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const matches = query.length > 0
    ? PROVINCES.filter((province) =>
      province.toLowerCase().startsWith(query.toLowerCase()) ||
      province.toLowerCase().includes(query.toLowerCase()),
    ).slice(0, 7)
    : [];

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, []);

  const selectProvince = useCallback((province: string) => {
    setQuery(province);
    onChange(province);
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || matches.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlighted((prev) => Math.min(prev + 1, matches.length - 1));
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlighted((prev) => Math.max(prev - 1, 0));
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      selectProvince(matches[highlighted]);
    }
    if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative text-left">
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          placeholder="Ej. Madrid, Sevilla..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            onChange('');
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => {
            if (query.length > 0) setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          className={`${baseInputClass} pr-9 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
        />
        <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      </div>
      <AnimatePresence>
        {open && matches.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full z-[80] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm"
            role="listbox"
          >
            {matches.map((province, index) => (
              <li
                key={province}
                role="option"
                aria-selected={index === highlighted}
                onMouseDown={(event) => {
                  event.preventDefault();
                  selectProvince(province);
                }}
                onMouseEnter={() => setHighlighted(index)}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${index === highlighted ? 'bg-orange-50 font-semibold text-[#FF8000]' : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                {province}
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function CaptacionForm() {
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SubmitPhase>('idle');
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [errors, setErrors] = useState<FormErrors>(emptyErrors);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');

  const validatePhone = (phone: string) => /^[+]?[\d\s]{9,15}$/.test(phone.trim());
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProvinceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, province: value }));
    if (value && errors.province) {
      setErrors((prev) => ({ ...prev, province: '' }));
    }
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service],
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase !== 'idle') return;

    const newErrors = { ...emptyErrors };
    let hasErrors = false;

    if (!formData.name.trim()) {
      newErrors.name = 'Por favor, introduce tu nombre.';
      hasErrors = true;
    }
    if (!formData.email.trim() || !validateEmail(formData.email)) {
      newErrors.email = 'Por favor, introduce tu email.';
      hasErrors = true;
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'El teléfono es requerido.';
      hasErrors = true;
    } else if (!validatePhone(formData.phone)) {
      newErrors.phone = 'Introduce un teléfono válido (ej. 671 355 775).';
      hasErrors = true;
    }
    if (!formData.province || !PROVINCES.includes(formData.province)) {
      newErrors.province = 'Selecciona tu provincia de la lista.';
      hasErrors = true;
    }
    if (!formData.employees) {
      newErrors.employees = 'Por favor, selecciona el número de empleados.';
      hasErrors = true;
    }

    if (!consent) {
      setConsentError('Debes aceptar la Política de Privacidad para continuar.');
      hasErrors = true;
    } else {
      setConsentError('');
    }

    if (hasErrors) {
      setErrors(newErrors);
      return;
    }

    setPhase('loading');

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: toInternationalPhone(formData.countryCode, formData.phone),
      province: formData.province,
      employees: formData.employees,
      services: selectedServices,
      source_context: 'captacion_inmobiliarias_page',
      ...getAttributionFields(),
    };

    notifyWhatsAppLead(payload);

    try {
      const response = await fetch('https://n8n.srv1123447.hstgr.cloud/webhook/d0652f82-339e-44be-b627-6d03353c2037', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        window.location.href = '/gracias';
      } else {
        setPhase('idle');
        alert('Hubo un error al enviar el formulario. Por favor, inténtalo de nuevo.');
      }
    } catch {
      setPhase('idle');
      alert('Error de conexión. Por favor, comprueba tu internet e inténtalo de nuevo.');
    }
  };

  return (
    <motion.div
      className="w-full max-w-2xl mx-auto  mb-20 relative z-20"
      initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.8, ease: EXPO, delay: 0.2 }}
    >
      <div className="w-full overflow-visible rounded-xl border border-slate-200 bg-white shadow-[0_24px_64px_-12px_rgba(0,0,0,0.25)]">
        <div className="px-8 py-8 md:px-10 md:py-10">
          <AnimatePresence mode="wait">
            {phase === 'sent' ? (
              <motion.div
                key="sent"
                className="flex flex-col items-center justify-center py-12 text-center"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: EXPO } }}
              >
                <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-full border-2 border-[#FF8000]">
                  <Check size={32} strokeWidth={2.5} className="text-[#FF8000]" />
                </div>
                <p className="text-2xl font-black tracking-[-0.03em] text-[#0F172A]">Enviado</p>
                <p className="mt-3 mb-8 max-w-[18rem] text-sm leading-relaxed text-slate-500">
                  Te contactaremos en menos de 24 h. Sin compromiso.
                </p>
                <a href="/" className="inline-flex items-center justify-center rounded-md bg-[#FF8000] px-8 py-4 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-[#E67300] hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,128,0,0.3)]">
                  SABER MÁS SOBRE COSIRIS
                </a>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 1 }}>
                <div className="mb-7">
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">Primer paso</p>
                  <h2 className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-[#0F172A]">
                    Cuentanos sobre tu negocio
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
                    Te contactamos en menos de 24 h para estudiar tu caso sin compromiso.
                  </p>
                </div>

                <form onSubmit={handleSubmit} noValidate className="space-y-4 text-left">
                  <div>
                    <label htmlFor="cp-name" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                      Nombre
                    </label>
                    <input
                      ref={firstInputRef}
                      id="cp-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Tu nombre completo"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`${baseInputClass} ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                    />
                    {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label htmlFor="cp-email" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                      Email
                    </label>
                    <input
                      id="cp-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="tu@email.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className={`${baseInputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                    />
                    {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="cp-phone" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                        Telefono
                      </label>
                      <div className="flex gap-2">
                        <CountryCodeSelect
                          id="cp-country-code"
                          value={formData.countryCode}
                          onChange={(dial) => setFormData((prev) => ({ ...prev, countryCode: dial }))}
                          ariaLabel="Indicativo de país"
                          className="w-32 shrink-0"
                        />
                        <input
                          id="cp-phone"
                          name="phone"
                          type="tel"
                          autoComplete="tel"
                          placeholder="671 355 775"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className={`${baseInputClass} ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                        />
                      </div>
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                        Provincia
                      </label>
                      <ProvinceField value={formData.province} onChange={handleProvinceChange} error={errors.province} />
                      {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                      Servicios de interes <span className="normal-case font-normal text-slate-400">(opcional)</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {SERVICE_OPTIONS.map((service) => {
                        const active = selectedServices.includes(service);
                        return (
                          <button
                            key={service}
                            type="button"
                            onClick={() => toggleService(service)}
                            className={`relative flex items-center justify-between rounded-md border px-3 py-2.5 text-xs font-semibold transition-all duration-200 ${active
                              ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#FF8000]/40 hover:bg-orange-50/30'
                              }`}
                          >
                            <span>{service}</span>
                            {active && (
                              <span className="ml-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF8000]">
                                <Check size={9} strokeWidth={3} className="text-white" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                      Numero de empleados
                    </label>
                    <div className="flex gap-1.5">
                      {['1-2', '3-5', '6-10', '+10'].map((range) => (
                        <button
                          key={range}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, employees: range }));
                            if (errors.employees) {
                              setErrors((prev) => ({ ...prev, employees: '' }));
                            }
                          }}
                          className={`flex-1 rounded-md border bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-800 transition-all duration-200 hover:border-[#FF8000] hover:bg-orange-50 ${formData.employees === range
                            ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]'
                            : errors.employees
                              ? 'border-red-400 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]'
                              : 'border-slate-200'
                            }`}
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                    {errors.employees && <p className="mt-1 text-xs text-red-500">{errors.employees}</p>}
                  </div>

                  <ConsentCheckbox
                    id="captacion-consent"
                    checked={consent}
                    onChange={(v) => { setConsent(v); if (v) setConsentError(''); }}
                    error={consentError}
                  />

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={phase === 'loading'}
                      className="group relative w-full overflow-hidden rounded-md bg-[#FF8000] py-3.5 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-80"
                    >
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-0"
                        style={{ transitionTimingFunction: 'cubic-bezier(0.19,1,0.22,1)' }}
                      />
                      <AnimatePresence mode="wait" initial={false}>
                        {phase === 'loading' ? (
                          <motion.span
                            key="spinner"
                            className="relative flex items-center justify-center gap-2"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                          >
                            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                              <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Enviando...
                          </motion.span>
                        ) : (
                          <motion.span
                            key="label"
                            className="relative"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.18 }}
                          >
                            Solicitar consulta gratuita
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                  </div>

                  <p className="text-center text-[11px] text-slate-500">
                    Sin spam · Sin permanencia · Comprometidos y Sencillos
                  </p>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function InmobiliariasHero() {
  return (
    <section className="relative mx-auto w-full max-w-3xl px-4 pt-12 pb-2 md:pt-16">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EXPO }}
        className="mx-auto mb-6 flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 shadow-sm"
      >
        <Building2 size={14} className="text-[#FF8000]" />
        <span className="text-xs font-semibold text-slate-700">Especialistas en marketing para inmobiliarias</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, ease: EXPO, delay: 0.1 }}
        className="text-balance text-4xl font-black leading-[1.08] tracking-[-0.03em] text-[#0F172A] md:text-5xl"
      >
        Deja de depender solo de referidos.
        <br />
        Construye un{' '}
        <span className="relative inline-flex text-[#FF8000]">
          sistema de captación
          <svg
            className="pointer-events-none absolute -bottom-1 left-0 h-2.5 w-full"
            viewBox="0 0 300 14"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <motion.path
              d="M4 10.5C90 3 210 3 296 10.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.75, delay: 0.55, ease: EXPO }}
            />
          </svg>
        </span>
        .
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EXPO, delay: 0.25 }}
        className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 md:text-lg"
      >
        Gestión de redes, captación de leads, email marketing y automatizaciones con IA — con un único proveedor especializado en el sector, sin permanencia.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EXPO, delay: 0.4 }}
        className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-medium text-slate-500"
      >
        <span><strong className="font-bold text-slate-900">+11 años</strong> en el sector</span>
        <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" aria-hidden="true" />
        <span><strong className="font-bold text-slate-900">+1.000</strong> inmobiliarias visitadas</span>
        <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" aria-hidden="true" />
        <span><strong className="font-bold text-slate-900">100%</strong> enfoque en captación</span>
      </motion.div>
    </section>
  );
}

export function CaptacionInmobiliariasPage() {
  useSEO({
    path: '/captacion_inmobiliarias',
    title: 'Sistema de captación para inmobiliarias | Cosiris',
    description: 'Deja de depender solo de referidos. Construye un sistema de captación de propietarios con Cosiris: gestión de redes, ads y agente IA para tu inmobiliaria.',
  });

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30 flex flex-col text-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <FormNavbar />

      <main className="z-10 flex flex-col flex-1 pb-12 pt-0 w-full relative">
        <InmobiliariasHero />

        <CaptacionForm />

        <SharedLandingSections disableYouTube={true} />
      </main>

    </div>
  );
}
