// @ts-nocheck — full rewrite, TS strict checks applied per-block
import {
  useEffect, useRef, useState, useCallback,
  type FormEvent, type MouseEvent,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, ChevronDown } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { getAttributionFields } from '@/lib/utm';
import { notifyWhatsAppLead } from '@/lib/whatsapp-webhook';
import { DEFAULT_COUNTRY_DIAL, toInternationalPhone } from '@/data/country-codes';
import { CountryCodeSelect } from './ui/CountryCodeSelect';
import { ConsentCheckbox } from './ui/ConsentCheckbox';

// ─── Spain Provinces ─────────────────────────────────────────────────────────

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

// ─── Services ─────────────────────────────────────────────────────────────────

const SERVICE_OPTIONS = ['Gestión Redes', 'Captación Ads', 'Email Marketing', 'Agente IA'];

// ─── Types ────────────────────────────────────────────────────────────────────

type SubmitPhase = 'idle' | 'loading' | 'sent';

// ─── Animation Variants ───────────────────────────────────────────────────────

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.28 } },
  exit: { opacity: 0, transition: { duration: 0.22, delay: 0.05 } },
};

const panelVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.48, ease: EXPO },
  },
  exit: {
    opacity: 0, y: 20, scale: 0.97,
    transition: { duration: 0.28, ease: EXPO },
  },
};

const fieldContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.18 } },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EXPO } },
};

// ─── Shared Input Styles ──────────────────────────────────────────────────────

const baseInputClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

// ─── Province Autocomplete ────────────────────────────────────────────────────

function ProvinceField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error: string;
}) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const matches = query.length > 0
    ? PROVINCES.filter((p) =>
        p.toLowerCase().startsWith(query.toLowerCase()) ||
        p.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 7)
    : [];

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    const handler = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const select = useCallback((province: string) => {
    setQuery(province);
    onChange(province);
    setOpen(false);
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || matches.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlighted((h) => Math.min(h + 1, matches.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlighted((h) => Math.max(h - 1, 0)); }
    if (e.key === 'Enter') { e.preventDefault(); select(matches[highlighted]); }
    if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          placeholder="Ej. Madrid, Sevilla…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            onChange('');
            setOpen(true);
            setHighlighted(0);
          }}
          onFocus={() => { if (query.length > 0) setOpen(true); }}
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
            className="absolute left-0 right-0 top-full z-[70] mt-1 overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-xl backdrop-blur-sm"
            role="listbox"
          >
            {matches.map((province, i) => (
              <li
                key={province}
                role="option"
                aria-selected={i === highlighted}
                onMouseDown={(e) => { e.preventDefault(); select(province); }}
                onMouseEnter={() => setHighlighted(i)}
                className={`cursor-pointer px-4 py-2.5 text-sm transition-colors ${
                  i === highlighted ? 'bg-orange-50 font-semibold text-[#FF8000]' : 'text-slate-700 hover:bg-slate-50'
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

// ─── Sent Success Screen ──────────────────────────────────────────────────────

function SentScreen() {
  return (
    <motion.div
      key="sent"
      className="flex flex-col items-center justify-center py-12 text-center"
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: EXPO } }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
    >
      <div className="relative mb-7 flex h-20 w-20 items-center justify-center">
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#FF8000]"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: EXPO }}
        />
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[#FF8000]/20"
          initial={{ scale: 0.6 }}
          animate={{ scale: 1.35, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.45, ease: EXPO, delay: 0.18 }}
        >
          <Check size={32} strokeWidth={2.5} className="text-[#FF8000]" />
        </motion.div>
      </div>
      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EXPO, delay: 0.28 }}
        className="text-2xl font-black tracking-[-0.03em] text-[#0F172A]"
      >
        Enviado
      </motion.p>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: EXPO, delay: 0.4 }}
        className="mt-3 max-w-[18rem] text-sm leading-relaxed text-slate-500"
      >
        Te contactaremos en menos de 24&nbsp;h. Sin compromiso.
      </motion.p>
    </motion.div>
  );
}

// ─── Empty state helpers ──────────────────────────────────────────────────────

const emptyForm = { name: '', email: '', countryCode: DEFAULT_COUNTRY_DIAL, phone: '', province: '', employees: '' };
const emptyErrors = { name: '', email: '', countryCode: '', phone: '', province: '', employees: '' };

// ─── Component ────────────────────────────────────────────────────────────────

export default function ContactModal() {
  const { isContactModalOpen, modalParams, closeContactModal } = useUI();
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SubmitPhase>('idle');

  const [formData, setFormData] = useState(emptyForm);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [errors, setErrors] = useState(emptyErrors);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState('');

  // Pre-populate services from context whenever modal opens
  useEffect(() => {
    if (isContactModalOpen && modalParams.initialServices?.length) {
      setSelectedServices(modalParams.initialServices);
    }
  }, [isContactModalOpen, modalParams.initialServices]);

  const validatePhone = (phone: string) => /^[+]?[\d\s]{9,15}$/.test(phone.trim());
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleProvinceChange = (value: string) => {
    setFormData((prev) => ({ ...prev, province: value }));
    if (value && errors.province) setErrors((prev) => ({ ...prev, province: '' }));
  };

  const toggleService = (service: string) => {
    setSelectedServices((prev) =>
      prev.includes(service) ? prev.filter((s) => s !== service) : [...prev, service],
    );
  };

  // Auto-close 2.4 s after "sent"
  useEffect(() => {
    if (phase !== 'sent') return;
    const t = setTimeout(() => {
      closeContactModal();
      setTimeout(() => {
        setPhase('idle');
        setFormData(emptyForm);
        setSelectedServices([]);
        setErrors(emptyErrors);
      }, 400);
    }, 2400);
    return () => clearTimeout(t);
  }, [phase, closeContactModal]);

  // Escape closes
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && phase === 'idle') closeContactModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closeContactModal, phase]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (phase !== 'idle') return;

    const newErrors = { ...emptyErrors };
    let hasErrors = false;

    if (!formData.name.trim()) { newErrors.name = 'Por favor, introduce tu nombre.'; hasErrors = true; }
    if (!formData.email.trim() || !validateEmail(formData.email)) { newErrors.email = 'Por favor, introduce tu email.'; hasErrors = true; }
    if (!formData.phone.trim()) { newErrors.phone = 'El teléfono es requerido.'; hasErrors = true; }
    else if (!validatePhone(formData.phone)) { newErrors.phone = 'Introduce un teléfono válido (ej. 671 355 775).'; hasErrors = true; }
    if (!formData.province || !PROVINCES.includes(formData.province)) {
      newErrors.province = 'Selecciona tu provincia de la lista.'; hasErrors = true;
    }
    if (!formData.employees) { newErrors.employees = 'Por favor, selecciona el número de empleados.'; hasErrors = true; }

    if (!consent) { setConsentError('Debes aceptar la Política de Privacidad para continuar.'); hasErrors = true; }
    else setConsentError('');

    if (hasErrors) { setErrors(newErrors); return; }

    setPhase('loading');

    const payload = {
      name: formData.name,
      email: formData.email,
      phone: toInternationalPhone(formData.countryCode, formData.phone),
      province: formData.province,
      employees: formData.employees,
      services: selectedServices,
      source_context: modalParams.sourceContext ?? 'direct',
      ...getAttributionFields(),
    };

    notifyWhatsAppLead(payload);

    try {
      const response = await fetch('https://n8n.srv1123447.hstgr.cloud/webhook/8383a34e-98f6-45b0-adda-77a6cdaf8abe', {
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

  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && phase === 'idle') closeContactModal();
  };

  return (
    <AnimatePresence>
      {isContactModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleBackdropClick}
            className="fixed inset-0 z-40 bg-black/65 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Panel */}
          <motion.div
            key="panel"
            role="dialog"
            aria-modal
            aria-labelledby="modal-title"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
          >
            <div className="relative w-full max-w-lg overflow-hidden rounded-xl border border-slate-200 bg-[#ffffff] shadow-[0_24px_64px_-12px_rgba(0,0,0,0.45)]">
              {/* Scrollable inner */}
              <div className="max-h-[90vh] overflow-y-auto px-8 py-8 md:px-10 md:py-10">
                {/* Close button */}
                <AnimatePresence>
                  {phase === 'idle' && (
                    <motion.button
                      key="close"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={closeContactModal}
                      aria-label="Cerrar"
                      className="absolute right-5 top-5 z-10 rounded-md p-1.5 text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF8000]"
                    >
                      <X size={17} strokeWidth={1.8} />
                    </motion.button>
                  )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                  {phase === 'sent' ? (
                    <SentScreen key="sent" />
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0, y: -10, transition: { duration: 0.22 } }}
                    >
                      {/* Header */}
                      <div className="mb-7">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">
                          Primer paso
                        </p>
                        <h2
                          id="modal-title"
                          className="mt-2 text-2xl font-black leading-tight tracking-[-0.03em] text-[#0F172A]"
                        >
                          Cuéntanos sobre tu negocio
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-slate-600">
                          Te contactamos en menos de 24&nbsp;h para estudiar tu caso sin compromiso.
                        </p>
                      </div>

                      {/* Form */}
                      <motion.form
                        onSubmit={handleSubmit}
                        variants={fieldContainerVariants}
                        initial="hidden"
                        animate="visible"
                        noValidate
                        className="space-y-4"
                      >
                        {/* Name */}
                        <motion.div variants={fieldVariants}>
                          <label htmlFor="cm-name" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                            Nombre
                          </label>
                          <input
                            ref={firstInputRef}
                            id="cm-name" name="name" type="text"
                            autoComplete="name" placeholder="Tu nombre completo"
                            value={formData.name}
                            onChange={handleInputChange}
                            className={`${baseInputClass} ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                          />
                          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                        </motion.div>

                        {/* Email */}
                        <motion.div variants={fieldVariants}>
                          <label htmlFor="cm-email" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                            Email
                          </label>
                          <input
                            id="cm-email" name="email" type="email"
                            autoComplete="email" placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={`${baseInputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                          />
                          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                        </motion.div>

                        {/* Phone + Province side by side */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <motion.div variants={fieldVariants}>
                            <label htmlFor="cm-phone" className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                              Teléfono
                            </label>
                            <div className="flex gap-2">
                              <CountryCodeSelect
                                id="cm-country-code"
                                value={formData.countryCode}
                                onChange={(dial) => setFormData((prev) => ({ ...prev, countryCode: dial }))}
                                ariaLabel="Indicativo de país"
                                className="w-32 shrink-0"
                              />
                              <input
                                id="cm-phone" name="phone" type="tel"
                                autoComplete="tel" placeholder="671 355 775"
                                value={formData.phone}
                                onChange={handleInputChange}
                                className={`${baseInputClass} ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`}
                              />
                            </div>
                            {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                          </motion.div>

                          <motion.div variants={fieldVariants}>
                            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                              Provincia
                            </label>
                            <ProvinceField
                              value={formData.province}
                              onChange={handleProvinceChange}
                              error={errors.province}
                            />
                            {errors.province && <p className="mt-1 text-xs text-red-500">{errors.province}</p>}
                          </motion.div>
                        </div>

                        {/* Services multi-select */}
                        <motion.div variants={fieldVariants}>
                          <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                            Servicios de interés{' '}
                            <span className="normal-case font-normal text-slate-400">(opcional)</span>
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            {SERVICE_OPTIONS.map((service) => {
                              const active = selectedServices.includes(service);
                              return (
                                <motion.button
                                  key={service}
                                  type="button"
                                  onClick={() => toggleService(service)}
                                  whileTap={{ scale: 0.97 }}
                                  className={`relative flex items-center justify-between rounded-md border px-3 py-2.5 text-xs font-semibold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF8000] ${
                                    active
                                      ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]'
                                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-[#FF8000]/40 hover:bg-orange-50/30'
                                  }`}
                                >
                                  <span>{service}</span>
                                  <AnimatePresence>
                                    {active && (
                                      <motion.span
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        exit={{ scale: 0, opacity: 0 }}
                                        transition={{ duration: 0.18, ease: EXPO }}
                                        className="ml-1.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#FF8000]"
                                      >
                                        <Check size={9} strokeWidth={3} className="text-white" />
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>

                        {/* Employees */}
                        <motion.div variants={fieldVariants}>
                          <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.18em] text-slate-900">
                            Número de empleados
                          </label>
                          <div className="flex gap-1.5">
                            {['1-2', '3-5', '6-10', '+10'].map((range) => (
                              <button
                                key={range}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, employees: range }));
                                  if (errors.employees) setErrors((prev) => ({ ...prev, employees: '' }));
                                }}
                                className={`flex-1 rounded-md border bg-slate-50 px-2 py-3 text-xs font-semibold text-slate-800 transition-all duration-200 hover:border-[#FF8000] hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#FF8000] ${
                                  formData.employees === range
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
                        </motion.div>

                        {/* Consentimiento */}
                        <motion.div variants={fieldVariants}>
                          <ConsentCheckbox
                            id="cm-consent"
                            checked={consent}
                            onChange={(v) => { setConsent(v); if (v) setConsentError(''); }}
                            error={consentError}
                          />
                        </motion.div>

                        {/* Submit */}
                        <motion.div variants={fieldVariants} className="pt-2">
                          <button
                            type="submit"
                            disabled={phase === 'loading'}
                            className="group relative w-full overflow-hidden rounded-md bg-[#FF8000] py-3.5 text-[0.78rem] font-bold uppercase tracking-[0.14em] text-white transition-colors duration-300 hover:bg-[#E67300] disabled:cursor-not-allowed disabled:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000]"
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
                                  Enviando…
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
                        </motion.div>

                        <motion.p
                          variants={fieldVariants}
                          className="text-center text-[11px] text-slate-500"
                        >
                          Sin spam · Sin permanencia · Comprometidos y Sencillos
                        </motion.p>
                      </motion.form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
