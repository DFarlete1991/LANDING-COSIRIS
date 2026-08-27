import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { LandingNavbar } from './landing-navbar';
import { useSEO } from '@/lib/seo';
import { getAttributionFields } from '@/lib/utm';

const EXPO = [0.19, 1, 0.22, 1] as const;

const inputClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

const primaryButtonClass =
  'w-full mt-6 flex items-center justify-center gap-2 rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300] active:scale-[0.99]';

export function VenderPage() {
  useSEO({
    path: '/valoratuvivienda',
    title: 'Valora tu vivienda gratis en 2 pasos | Cosiris',
    description: 'Formulario gratuito para particulares que quieren vender su vivienda. Recibe una valoración y te conectamos con la mejor inmobiliaria de tu zona.',
  });

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNextPhase1 = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Por favor, introduce tu nombre.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Introduce un email válido.';
    if (!phone.trim() || !/^[+]?[\d\s]{9,15}$/.test(phone)) errs.phone = 'Introduce un teléfono válido.';
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({}); setStep(2);
  };

  const handleNextPhase2 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = 'La dirección es obligatoria.';
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});
    handleSubmit();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setErrors({});
    setIsSubmitting(true);

    const payload = {
      name,
      email,
      phone,
      address,
      source_context: 'landing_valoratuvivienda_particulares',
      timestamp: new Date().toISOString(),
      ...getAttributionFields(),
    };

    try {
      const response = await fetch('https://n8n.srv1123447.hstgr.cloud/webhook/d0652f82-339e-44be-b627-6d03353c2037', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (response.ok) {
        setSubmitted(true);
        window.location.href = '/gracias-vender';
      } else {
        alert('Hubo un error al enviar tu solicitud.');
      }
    } catch (e) {
      alert('Hubo un error al enviar tu solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const progress = submitted ? 100 : ((step - 1) / 2) * 100;

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>

      <LandingNavbar />

      <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-12 w-full max-w-2xl mx-auto min-h-screen">
        <AnimatePresence mode="wait">
          {!submitted && (
            <motion.div key="headers" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-8 rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
              <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-slate-900 leading-tight">
                Valora tu vivienda en 2 pasos
              </h1>
              <p className="mt-4 text-sm md:text-base text-slate-600 font-medium max-w-xl mx-auto">
                Formulario para particulares que quieren vender su vivienda.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative w-full overflow-visible rounded-md border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
          
          {!submitted && (
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
              <motion.div className="h-full bg-[#FF8000]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.5, ease: EXPO }} />
            </div>
          )}

          <div className="p-8 md:p-10 relative">
            <AnimatePresence mode="wait" custom={step}>
              {submitted ? (
                <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-100 bg-orange-50">
                    <Check size={32} strokeWidth={2.5} className="text-[#FF8000]" />
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3 text-center">Solicitud recibida</h2>
                  <p className="text-center text-slate-600 mb-8">Nuestro equipo la analizará y te contactaremos en menos de 24h.</p>
                  <a href="/" className="inline-flex items-center justify-center rounded-md bg-[#FF8000] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#E67300] hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,128,0,0.3)]">
                    SABER MÁS SOBRE COSIRIS
                  </a>
                </motion.div>
              ) : step === 1 ? (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Datos de contacto</h2>
                    <p className="text-xs text-slate-500">Tus datos están seguros y protegidos.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nombre completo</label>
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. María López" className={`${inputClass} ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" className={`${inputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Teléfono</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 000 000" className={`${inputClass} ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                      {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                    </div>
                  </div>
                  <button onClick={handleNextPhase1} className={primaryButtonClass}>
                    Siguiente <ArrowRight size={16} />
                  </button>
                </motion.div>
              ) : (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Dirección del inmueble</h2>
                    <p className="text-xs text-slate-500">Escribe calle y número para ver sugerencias en España.</p>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Dirección</label>
                      <AddressAutocomplete value={address} onChange={setAddress} error={Boolean(errors.address)} />
                      {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setStep(1)} disabled={isSubmitting} className="rounded-md border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-70">Volver</button>
                    <button onClick={handleNextPhase2} disabled={isSubmitting} className="flex-1 flex items-center justify-center gap-2 rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300] disabled:opacity-70">
                      {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Solicitar valoración'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}
