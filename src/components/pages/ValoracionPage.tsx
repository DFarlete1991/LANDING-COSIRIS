import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { FormNavbar } from '../ui/form-navbar';
import { WhyChooseCosiris, HowItWorks } from '../ui/valoracion-blocks';
import { useSEO } from '@/lib/seo';
import { getAttributionFields } from '@/lib/utm';

const EXPO = [0.19, 1, 0.22, 1] as const;

const inputClass =
  'w-full rounded-md border bg-slate-50 px-4 py-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:ring-4 focus:ring-[#FF8000]/15';

type Reason = 'Cambio de vivienda' | 'Herencia' | 'Separación o divorcio' | 'Problemas económicos' | 'Otro' | '';
type Timeframe = 'Aún no la he puesto a la venta.' | 'Ya se la he dado a otras inmobiliarias.' | 'La tengo anunciada como particular.' | 'Lleva más de 3 meses a la venta y no se ha vendido.' | '';

export function ValoracionPage() {
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '');
  const isFormsPath = currentPath.includes('/forms');

  useSEO({
    path: isFormsPath ? '/vendetuvivienda/forms' : '/vendetuvivienda',
    title: isFormsPath
      ? 'Valora tu vivienda con precisión | Cosiris'
      : 'Vende tu vivienda con una buena valoración de mercado | Cosiris',
    description: 'Vender una vivienda empieza por una buena valoración de mercado. Solicita la tuya gratis y te conectamos con la inmobiliaria adecuada.',
  });

  const [step, setStep] = useState(isFormsPath ? 2 : 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const autoAdvanceTimerRef = useRef<number | null>(null);

  const [address, setAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [reason, setReason] = useState<Reason>('');
  const [timeframe, setTimeframe] = useState<Timeframe>('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const onPopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', onPopState);
    return () => {
      window.removeEventListener('popstate', onPopState);
      if (autoAdvanceTimerRef.current !== null) {
        window.clearTimeout(autoAdvanceTimerRef.current);
      }
    };
  }, []);

  // Mantener los pasos en sincronía y proteger la ruta de formularios
  useEffect(() => {
    if (!isFormsPath && step > 1) {
      setStep(1);
    } else if (isFormsPath && (!address.trim() || !postalCode.trim())) {
      // Si entran a /forms directo sin rellenar la primera parte o refrescan
      setStep(1);
      window.history.replaceState({}, '', '/vendetuvivienda');
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath('/vendetuvivienda');
    } else if (isFormsPath && step === 1 && address.trim() && postalCode.trim()) {
      setStep(2);
    }
  }, [isFormsPath, step, address, postalCode]);

  const goToFormsPage = (targetStep: number) => {
    setStep(targetStep);
    if (!isFormsPath) {
      window.history.pushState({}, '', '/vendetuvivienda/forms');
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToLandingPage = () => {
    setStep(1);
    window.history.pushState({}, '', '/vendetuvivienda');
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNextPhase1 = () => {
    const errs: Record<string, string> = {};
    if (!address.trim()) errs.address = 'La dirección es obligatoria.';
    if (!postalCode.trim() || !/^\d{5}$/.test(postalCode)) errs.postalCode = 'C.P. debe tener 5 dígitos.';
    if (Object.keys(errs).length > 0) return setErrors(errs);
    setErrors({});
    goToFormsPage(2);
  };

  const handleMainCTA = () => {
    setErrors({});
    goToFormsPage(1);
  };

  const handleSubmitPhase4 = async () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Introduce tu nombre.';
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) errs.email = 'Introduce un email válido.';
    if (!phone.trim() || !/^[+]?[\d\s]{9,15}$/.test(phone)) errs.phone = 'Introduce un teléfono válido.';
    if (Object.keys(errs).length > 0) return setErrors(errs);
    
    setErrors({}); setIsSubmitting(true);

    const payload = {
      address, postalCode, reason, timeframe, email, name, phone,
      source_context: 'landing_vendetuvivienda_boutique',
      timestamp: new Date().toISOString(),
      ...getAttributionFields(),
    };

    try {
      const response = await fetch('https://n8n.srv1123447.hstgr.cloud/webhook/a775df38-0b86-474d-8fad-067049def95a', {
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

  // En la landing o el step 1 no es tan relevante el progreso, pero se calcula para el resto
  const progress = submitted ? 100 : ((step - 1) / 4) * 100;

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>

      <FormNavbar />

      <main className="z-10 flex-1 flex flex-col w-full relative">
        <section className={`flex flex-col items-center justify-center px-4 pt-10 pb-20 w-full max-w-2xl mx-auto ${isFormsPath ? 'min-h-[80vh]' : 'mt-8 md:mt-12'}`}>
          <AnimatePresence mode="wait">
            {!submitted && (
              <motion.div key="headers" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="mb-8 rounded-xl bg-white/60 p-4 text-center backdrop-blur-sm">
                <h1 className={`tracking-tighter text-slate-900 leading-tight ${isFormsPath ? 'text-3xl md:text-4xl font-bold' : 'text-3xl md:text-5xl font-black uppercase'}`}>
                  {isFormsPath ? 'Valora tu vivienda con precisión' : 'Vender una vivienda empieza por una buena valoración de mercado.'}
                </h1>
                <p className="mt-4 text-sm md:text-base text-slate-600 font-medium">
                  {isFormsPath ? 'Paso a paso para obtener el mejor resultado de forma exclusiva.' : 'Introduce la dirección de tu inmueble para comenzar gratuitamente.'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="relative w-full overflow-visible rounded-md border border-slate-100 bg-white shadow-2xl shadow-slate-200/50"
            initial={{ opacity: 0, y: 40, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.8, ease: EXPO, delay: 0.1 }}
          >
            {(!submitted && isFormsPath && step > 1) && (
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
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3 text-center">¡Solicitud completada!</h2>
                    <p className="text-center text-slate-600 mb-8">Procesaremos tus datos y te enviaremos la valoración lo antes posible.</p>
                    <a href="/" className="inline-flex items-center justify-center rounded-md bg-[#FF8000] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#E67300] hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,128,0,0.3)]">
                      SABER MÁS SOBRE COSIRIS
                    </a>
                  </motion.div>
                ) : step === 1 ? (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Dirección del inmueble</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Dirección</label>
                        <AddressAutocomplete
                          value={address}
                          onChange={setAddress}
                          error={Boolean(errors.address)}
                          onSelectDetails={(details) => {
                            if (details.postalCode) {
                              setPostalCode(details.postalCode);
                            }
                          }}
                        />
                        {errors.address && <p className="mt-1 text-xs text-red-500">{errors.address}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Código Postal</label>
                        <input type="text" maxLength={5} value={postalCode} onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, ''))} className={`${inputClass} ${errors.postalCode ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                        {errors.postalCode && <p className="mt-1 text-xs text-red-500">{errors.postalCode}</p>}
                      </div>
                    </div>
                    <button onClick={handleNextPhase1} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300] active:scale-[0.99] group">
                      Siguiente 
                      <ArrowRight size={16} className="translate-x-0 transition-transform group-hover:translate-x-1" />
                    </button>
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">¿Cuál es el motivo principal de la venta?</h2>
                    <div className="grid grid-cols-1 gap-3">
                      {(['Cambio de vivienda', 'Herencia', 'Separación o divorcio', 'Problemas económicos', 'Otro'] as Reason[]).map((r) => (
                        <button
                          key={r}
                          onClick={() => {
                            if (isAutoAdvancing) return;
                            setReason(r);
                            setErrors({});
                            setIsAutoAdvancing(true);
                            autoAdvanceTimerRef.current = window.setTimeout(() => {
                              setStep(3);
                              setIsAutoAdvancing(false);
                            }, 280);
                          }}
                          disabled={isAutoAdvancing}
                          className={`rounded-md border px-4 py-4 text-left text-sm font-semibold transition-all ${reason === r ? 'border-[#FF8000] bg-orange-50 text-[#FF8000] ring-1 ring-[#FF8000]/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                    {errors.reason && <p className="text-xs text-red-500">{errors.reason}</p>}
                    <div className="flex gap-3 mt-6">
                      <button onClick={goToLandingPage} disabled={isAutoAdvancing} className="rounded-md border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 disabled:opacity-70 hover:bg-slate-50 transition-colors">Volver</button>
                    </div>
                  </motion.div>
                ) : step === 3 ? (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">¿Cuánto tiempo llevas intentando vender tu propiedad?</h2>
                    <div className="flex flex-col gap-3">
                      {(['Aún no la he puesto a la venta.', 'Ya se la he dado a otras inmobiliarias.', 'La tengo anunciada como particular.', 'Lleva más de 3 meses a la venta y no se ha vendido.'] as Timeframe[]).map((t) => (
                        <button
                          key={t}
                          onClick={() => {
                            if (isAutoAdvancing) return;
                            setTimeframe(t);
                            setErrors({});
                            setIsAutoAdvancing(true);
                            autoAdvanceTimerRef.current = window.setTimeout(() => {
                              setStep(4);
                              setIsAutoAdvancing(false);
                            }, 280);
                          }}
                          disabled={isAutoAdvancing}
                          className={`rounded-md border px-4 py-4 text-left text-sm font-semibold transition-all ${timeframe === t ? 'border-[#FF8000] bg-orange-50 text-[#FF8000] ring-1 ring-[#FF8000]/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    {errors.timeframe && <p className="text-xs text-red-500">{errors.timeframe}</p>}
                    <div className="flex gap-3 mt-6">
                      <button onClick={() => setStep(2)} disabled={isAutoAdvancing} className="rounded-md border border-slate-200 bg-white px-6 py-4 text-sm font-bold text-slate-600 disabled:opacity-70 hover:bg-slate-50 transition-colors">Volver</button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.4 }} className="space-y-6">
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">Datos de contacto</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={`${inputClass} ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                        {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Nombre completo</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={`${inputClass} ${errors.name ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 mb-1.5">Teléfono</label>
                        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={`${inputClass} ${errors.phone ? 'border-red-500 focus:border-red-500' : 'border-slate-200 focus:border-[#FF8000]'}`} />
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-3 mt-8">
                      <button onClick={() => setStep(3)} disabled={isSubmitting} className="rounded-md border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Volver</button>
                      <button onClick={handleSubmitPhase4} disabled={isSubmitting} className="flex flex-1 items-center justify-center rounded-md bg-[#FF8000] py-4 text-sm font-bold text-white transition-all duration-200 hover:bg-[#E67300]">
                        {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : "Obtener mi valoración gratuita"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </section>

        {!isFormsPath && !submitted && (
          <div className="pb-16">
            <WhyChooseCosiris />
            <HowItWorks onCTAClick={handleMainCTA} />
          </div>
        )}
      </main>
    </div>
  );
}