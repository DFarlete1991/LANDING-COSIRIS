import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Loader2 } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/15';

type Phase = 'idle' | 'loading' | 'sent' | 'error';

type Motivo = 'Cambio de vivienda' | 'Herencia' | 'Separación o divorcio' | 'Problemas económicos' | 'Otro' | '';
const MOTIVOS: Motivo[] = ['Cambio de vivienda', 'Herencia', 'Separación o divorcio', 'Problemas económicos', 'Otro'];

type Tiempo = 'Aún no la he puesto a la venta.' | 'Ya se la he dado a otras inmobiliarias.' | 'La tengo anunciada como particular.' | 'Lleva más de 3 meses a la venta y no se ha vendido.' | '';
const TIEMPOS: Tiempo[] = [
  'Aún no la he puesto a la venta.',
  'Ya se la he dado a otras inmobiliarias.',
  'La tengo anunciada como particular.',
  'Lleva más de 3 meses a la venta y no se ha vendido.',
];

type Plazo = 'Cuanto antes (0-3 meses)' | 'Normal (3-6 meses)' | 'No tengo prisa (6-12 meses)' | 'No quiero vender' | '';
const PLAZOS: Plazo[] = ['Cuanto antes (0-3 meses)', 'Normal (3-6 meses)', 'No tengo prisa (6-12 meses)', 'No quiero vender'];

// URL del CRM: en producción se define con VITE_CRM_API_URL (build-time env de
// Vite); en local cae a localhost:3000 (puerto por defecto de `next dev`).
const CRM_API_URL = import.meta.env.VITE_CRM_API_URL ?? 'http://localhost:3000';

// Crea el lead de verdad en el CRM (app/api/public/portal-lead/route.ts) —
// mismo patrón que createManualLeadAction del admin, pero público y
// etiquetado con tipo_origen "Portal Inmobiliarias" para poder distinguirlo.
// Las respuestas de calificación (motivo, tiempo, plazo) van dentro de
// `mensaje` como nota del lead — el endpoint no tiene columnas propias para
// cada una, y así quedan visibles igual en el CRM sin tocar el backend.
async function submitAgencyLead(payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  try {
    const response = await fetch(`${CRM_API_URL}/api/public/portal-lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (response.ok) return { ok: true };
    const data = await response.json().catch(() => null);
    return { ok: false, error: data?.error ?? 'No se pudo enviar el mensaje.' };
  } catch {
    return { ok: false, error: 'Error de conexión con el CRM.' };
  }
}

const TOTAL_STEPS = 5;

export function AgencyLeadForm({ agency }: { agency: InmobiliariaPublica }) {
  const [step, setStep] = useState(1);
  const [phase, setPhase] = useState<Phase>('idle');
  const [isAutoAdvancing, setIsAutoAdvancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [direccion, setDireccion] = useState('');
  const [cp, setCp] = useState('');
  const [motivo, setMotivo] = useState<Motivo>('');
  const [tiempo, setTiempo] = useState<Tiempo>('');
  const [plazo, setPlazo] = useState<Plazo>('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');

  const advanceAfter = (next: number, delay = 280) => {
    if (isAutoAdvancing) return;
    setIsAutoAdvancing(true);
    window.setTimeout(() => {
      setStep(next);
      setIsAutoAdvancing(false);
    }, delay);
  };

  const handleStep1 = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!direccion.trim() || !cp.trim()) {
      setErrorMessage('Introduce la dirección y el código postal.');
      return;
    }
    setErrorMessage('');
    setStep(2);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'loading') return;

    if (!nombre.trim() || (!telefono.trim() && !email.trim())) {
      setErrorMessage('Introduce tu nombre y al menos un teléfono o email.');
      return;
    }

    setErrorMessage('');
    setPhase('loading');

    const mensaje = [
      `Dirección: ${direccion} (CP ${cp})`,
      motivo && `Motivo de venta: ${motivo}`,
      tiempo && `Tiempo intentando vender: ${tiempo}`,
      plazo && `Plazo deseado: ${plazo}`,
    ].filter(Boolean).join('\n');

    const result = await submitAgencyLead({
      client_id: agency.id,
      nombre,
      telefono: telefono || null,
      email: email || null,
      mensaje,
      tipo_origen: 'Portal Inmobiliarias',
    });

    if (result.ok) {
      setPhase('sent');
    } else {
      setErrorMessage(result.error ?? 'No se pudo enviar el mensaje.');
      setPhase('error');
    }
  };

  if (phase === 'sent') {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center shadow-inner">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
          <Check size={22} strokeWidth={2.5} className="text-emerald-600" />
        </div>
        <p className="text-sm font-bold text-emerald-900">Mensaje enviado</p>
        <p className="text-xs text-emerald-700">Te contactarán directamente en breve.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-[#FF8000]' : 'bg-slate-100'}`} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form key="s1" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} onSubmit={handleStep1} noValidate className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Sobre tu vivienda</p>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">Dirección de la vivienda</label>
              <input value={direccion} onChange={(e) => setDireccion(e.target.value)} className={inputClass} placeholder="Calle, número" />
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">Código postal</label>
              <input value={cp} onChange={(e) => setCp(e.target.value.replace(/\D/g, '').slice(0, 5))} className={inputClass} placeholder="28001" />
            </div>
            <button type="submit" style={{ backgroundColor: agency.color_hex }} className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-black/10 transition-all duration-200 hover:opacity-90 active:scale-[0.98]">
              Siguiente <ArrowRight size={14} />
            </button>
          </motion.form>
        ) : step === 2 ? (
          <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">¿Cuál es el motivo principal de la venta?</p>
            <div className="grid gap-2">
              {MOTIVOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  disabled={isAutoAdvancing}
                  onClick={() => { setMotivo(m); advanceAfter(3); }}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${motivo === m ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Volver</button>
          </motion.div>
        ) : step === 3 ? (
          <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">¿Cuánto tiempo llevas intentando vender tu propiedad?</p>
            <div className="grid gap-2">
              {TIEMPOS.map((t) => (
                <button
                  key={t}
                  type="button"
                  disabled={isAutoAdvancing}
                  onClick={() => { setTiempo(t); advanceAfter(4); }}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${tiempo === t ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(2)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Volver</button>
          </motion.div>
        ) : step === 4 ? (
          <motion.div key="s4" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">¿En qué plazo te gustaría vender?</p>
            <div className="grid gap-2">
              {PLAZOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isAutoAdvancing}
                  onClick={() => { setPlazo(p); advanceAfter(5); }}
                  className={`rounded-lg border px-3 py-2.5 text-left text-xs font-semibold transition-all ${plazo === p ? 'border-[#FF8000] bg-orange-50 text-[#FF8000]' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => setStep(3)} className="text-xs font-semibold text-slate-400 hover:text-slate-600">Volver</button>
          </motion.div>
        ) : (
          <motion.form key="s5" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} onSubmit={handleSubmit} noValidate className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">Tus datos de contacto</p>
            <div>
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">Nombre</label>
              <input value={nombre} onChange={(e) => setNombre(e.target.value)} className={inputClass} placeholder="Tu nombre" />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">Teléfono</label>
                <input value={telefono} onChange={(e) => setTelefono(e.target.value)} className={inputClass} placeholder="600 000 000" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="tu@email.com" />
              </div>
            </div>

            <AnimatePresence>
              {errorMessage && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-xs text-red-500">
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex gap-2">
              <button type="button" onClick={() => setStep(4)} disabled={phase === 'loading'} className="rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-xs font-bold text-slate-500 transition hover:bg-slate-50 disabled:opacity-60">
                Volver
              </button>
              <button
                type="submit"
                disabled={phase === 'loading'}
                style={{ backgroundColor: agency.color_hex }}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-black/10 transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
              >
                {phase === 'loading' ? <Loader2 size={14} className="animate-spin" /> : `Contactar con ${agency.nombre_comercial}`}
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}
