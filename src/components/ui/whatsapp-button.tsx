import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowUpRight, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useUI } from '@/context/UIContext';
import { CountryCodeSelect } from '@/components/ui/CountryCodeSelect';
import { ConsentCheckbox } from '@/components/ui/ConsentCheckbox';
import { DEFAULT_COUNTRY_DIAL, toInternationalPhone } from '@/data/country-codes';
import { LEAD_WEBHOOK_URL } from '@/lib/lead-webhook';
import { getAttributionFields } from '@/lib/utm';

// Botón flotante de WhatsApp. El visitante deja nombre, teléfono (con prefijo) y
// correo; esos datos se mandan al mismo webhook de n8n que el formulario de
// contacto (de ahí sale la fila del Google Sheet) y después se le abre WhatsApp
// con un saludo fijo, sin sus datos. En escritorio también se muestra un QR para
// abrirlo desde el móvil.

// Número de destino en formato internacional, solo dígitos (Colombia +57).
const WHATSAPP_NUMBER = '573197229868';
const WHATSAPP_TEXT = 'Hola, vengo de la página web, me interesa saber más sobre sus servicios';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_TEXT)}`;
const EASE = [0.23, 1, 0.32, 1] as const;

type Form = { name: string; dial: string; phone: string; email: string };
type Errors = Partial<Record<'name' | 'phone' | 'email' | 'consent', string>>;

const EMPTY: Form = { name: '', dial: DEFAULT_COUNTRY_DIAL, phone: '', email: '' };

// Si el visitante ya escribió el prefijo en el número ("+34 600…"), se quita
// para no duplicarlo.
function fullPhone(dial: string, phone: string) {
  const trimmed = phone.trim();
  const dialDigits = dial.replace(/\D/g, '');
  const local = trimmed.startsWith('+') && trimmed.replace(/\D/g, '').startsWith(dialDigits)
    ? trimmed.replace(/\D/g, '').slice(dialDigits.length)
    : trimmed;
  return toInternationalPhone(dial, local);
}

// Mismo formato de lead que el formulario de contacto, para que n8n lo guarde
// en las mismas columnas del Sheet. `keepalive` deja terminar el envío aunque el
// móvil salte a la app de WhatsApp. Si falla, no se bloquea al visitante.
function saveLead(form: Form) {
  const payload = {
    name: form.name.trim(),
    company: '',
    email: form.email.trim(),
    phone: fullPhone(form.dial, form.phone),
    province: '',
    employees: '',
    services: [],
    source_context: 'home_whatsapp_button',
    ...getAttributionFields(),
  };
  fetch(LEAD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {});
}

function validate(form: Form, consent: boolean): Errors {
  const errors: Errors = {};
  if (form.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = 'Escribe tu nombre y apellido.';
  const digits = form.phone.replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 15) errors.phone = 'Introduce un teléfono válido.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) errors.email = 'Introduce un correo válido.';
  if (!consent) errors.consent = 'Debes aceptar la política de privacidad.';
  return errors;
}

export function WhatsAppIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35Zm-5.42 7.4h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88Zm8.41-18.3A11.81 11.81 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41Z" />
    </svg>
  );
}

const LABEL = 'mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-900';
const INPUT =
  'w-full min-h-11 rounded-md border bg-slate-50 px-3 py-2 text-sm text-neutral-900 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';
const border = (error?: string) => (error ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]');

export function WhatsAppButton() {
  const { isContactModalOpen } = useUI();
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [link, setLink] = useState<string | null>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const sentRef = useRef<string | null>(null);

  // Al cerrar se vuelve al formulario (con los datos guardados) y el foco
  // regresa al botón flotante.
  const close = () => {
    setOpen(false);
    setLink(null);
    triggerRef.current?.focus();
  };

  // Si se abre el formulario de contacto, el panel se cierra del todo (ajuste
  // de estado durante el render, sin efecto).
  if (isContactModalOpen && open) setOpen(false);

  // Igual que el botón anterior: aparece al dejar atrás el hero y se esconde
  // cerca del final, salvo que el panel esté abierto.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearEnd = y + window.innerHeight > document.documentElement.scrollHeight - window.innerHeight * 1.2;
      setVisible(y > window.innerHeight * 0.6 && !nearEnd);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    // Si la lista de países está abierta, Escape solo cierra esa lista. Se
    // escucha en captura para leer su estado antes de que react-select lo cambie.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (document.getElementById('wa-dial')?.getAttribute('aria-expanded') === 'true') return;
      close();
    };
    window.addEventListener('keydown', onKey, true);
    if (!link) firstFieldRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, link]);

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(form, consent);
    setErrors(next);
    if (Object.keys(next).length) return;
    // Si vuelve atrás y envía los mismos datos, no se duplica la fila.
    const key = JSON.stringify(form);
    if (sentRef.current !== key) {
      saveLead(form);
      sentRef.current = key;
    }
    setLink(WHATSAPP_LINK);
    // En móvil se abre WhatsApp directamente; en escritorio se deja ver el QR.
    if (window.matchMedia('(max-width: 767px)').matches) window.open(WHATSAPP_LINK, '_blank', 'noopener,noreferrer');
  };

  const shown = (visible || open) && !isContactModalOpen;

  return (
    <>
      <AnimatePresence>
        {open && !isContactModalOpen && (
          <motion.div
            id="wa-panel"
            role="dialog"
            aria-modal="false"
            aria-labelledby="wa-title"
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{ transformOrigin: 'bottom right' }}
            className="fixed inset-x-3 bottom-20 z-50 max-h-[calc(100dvh-6.5rem)] overflow-y-auto rounded-2xl bg-white shadow-2xl shadow-black/25 ring-1 ring-black/10 sm:inset-x-auto sm:right-4 sm:w-[23rem] md:right-6 md:bottom-24"
          >
            <div className="flex items-center gap-3 bg-[#075E54] px-4 py-3.5 text-white">
              <span className="flex size-9 items-center justify-center rounded-full bg-[#25D366]">
                <WhatsAppIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p id="wa-title" className="text-sm font-bold">Escríbenos por WhatsApp</p>
                <p className="text-xs text-white/75">Te respondemos lo antes posible</p>
              </div>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {!link ? (
              <form onSubmit={onSubmit} noValidate className="space-y-3.5 p-4">
                <p className="text-sm text-neutral-600">Déjanos tus datos y te llevamos a nuestro WhatsApp.</p>

                <div>
                  <label htmlFor="wa-name" className={LABEL}>Nombre completo</label>
                  <input
                    ref={firstFieldRef}
                    id="wa-name"
                    autoComplete="name"
                    value={form.name}
                    onChange={(e) => set('name', e.target.value)}
                    placeholder="Ana García López"
                    className={`${INPUT} ${border(errors.name)}`}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="wa-phone" className={LABEL}>Teléfono</label>
                  <div className="flex gap-2">
                    <CountryCodeSelect
                      id="wa-dial"
                      ariaLabel="Prefijo del país"
                      value={form.dial}
                      onChange={(dial) => set('dial', dial)}
                      className="w-[7.5rem] shrink-0"
                    />
                    <input
                      id="wa-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      value={form.phone}
                      onChange={(e) => set('phone', e.target.value)}
                      placeholder="600 123 456"
                      className={`${INPUT} ${border(errors.phone)}`}
                    />
                  </div>
                  {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                </div>

                <div>
                  <label htmlFor="wa-email" className={LABEL}>Correo electrónico</label>
                  <input
                    id="wa-email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => set('email', e.target.value)}
                    placeholder="ana@correo.com"
                    className={`${INPUT} ${border(errors.email)}`}
                  />
                  {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                </div>

                <ConsentCheckbox
                  id="wa-consent"
                  checked={consent}
                  onChange={(checked) => {
                    setConsent(checked);
                    setErrors((prev) => ({ ...prev, consent: undefined }));
                  }}
                  error={errors.consent}
                />

                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-[#053B2F] transition-[background-color,transform] duration-150 hover:bg-[#1FBF5B] active:scale-[0.98]"
                >
                  <WhatsAppIcon className="size-5" />
                  Continuar a WhatsApp
                </button>
              </form>
            ) : (
              <div className="space-y-4 p-4 text-center">
                <p className="text-sm text-neutral-600">
                  ¡Gracias! Ya tenemos tus datos. Abre WhatsApp y pulsa <strong>enviar</strong> para empezar a hablar con nosotros.
                </p>

                <div className="hidden md:block">
                  <div className="mx-auto w-fit rounded-xl border border-slate-200 bg-white p-3">
                    <QRCodeSVG value={link} size={200} level="L" marginSize={0} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Escanéalo con la cámara de tu móvil</p>
                </div>

                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 text-sm font-bold text-[#053B2F] transition-[background-color,transform] duration-150 hover:bg-[#1FBF5B] active:scale-[0.98]"
                >
                  <WhatsAppIcon className="size-5" />
                  Abrir WhatsApp
                  <ArrowUpRight size={16} />
                </a>

                <button
                  type="button"
                  onClick={() => setLink(null)}
                  className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-slate-500 transition-colors hover:text-neutral-900"
                >
                  <ArrowLeft size={14} /> Editar mis datos
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-hidden={!shown}
        aria-expanded={open}
        aria-controls="wa-panel"
        aria-label={open ? 'Cerrar WhatsApp' : '¿Dudas? Escríbenos por WhatsApp'}
        tabIndex={shown ? 0 : -1}
        className={`fixed right-4 bottom-4 z-50 inline-flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white shadow-lg shadow-black/25 ring-1 ring-white/15 transition-[opacity,transform,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] md:right-6 md:bottom-6 ${
          shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
        }`}
      >
        {open ? <X size={22} className="text-[#25D366]" /> : <WhatsAppIcon className="size-7 text-[#25D366]" />}
      </button>
    </>
  );
}
