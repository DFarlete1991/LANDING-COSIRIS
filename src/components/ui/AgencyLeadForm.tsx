import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

const inputClass =
  'w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:bg-white focus:border-[#FF8000] focus:ring-4 focus:ring-[#FF8000]/15';

type Phase = 'idle' | 'loading' | 'sent' | 'error';

// URL del CRM: en producción se define con VITE_CRM_API_URL (build-time env de
// Vite); en local cae a localhost:3000 (puerto por defecto de `next dev`).
const CRM_API_URL = import.meta.env.VITE_CRM_API_URL ?? 'http://localhost:3000';

// Crea el lead de verdad en el CRM (app/api/public/portal-lead/route.ts) —
// mismo patrón que createManualLeadAction del admin, pero público y
// etiquetado con tipo_origen "Portal Inmobiliarias" para poder distinguirlo.
// Nota: con datos mock (agency.id tipo "mock-madrid-centro") el CRM
// responderá 404 porque ese id no existe en Supabase — es lo esperado hasta
// que el directorio lea inmobiliarias reales.
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

export function AgencyLeadForm({ agency }: { agency: InmobiliariaPublica }) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [errorMessage, setErrorMessage] = useState('Introduce tu nombre y al menos un teléfono o email.');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (phase === 'loading') return;

    if (!nombre.trim() || (!telefono.trim() && !email.trim())) {
      setErrorMessage('Introduce tu nombre y al menos un teléfono o email.');
      setPhase('error');
      return;
    }

    setPhase('loading');
    const result = await submitAgencyLead({
      client_id: agency.id,
      nombre,
      telefono: telefono || null,
      email: email || null,
      mensaje: mensaje || null,
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
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
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
      <div>
        <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-slate-900">
          Mensaje <span className="normal-case font-normal text-slate-400">(opcional)</span>
        </label>
        <textarea
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          rows={3}
          className={inputClass}
          placeholder={`Cuéntale a ${agency.nombre_comercial} qué necesitas...`}
        />
      </div>

      <AnimatePresence>
        {phase === 'error' && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-red-500"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={phase === 'loading'}
        style={{ backgroundColor: agency.color_hex }}
        className="w-full rounded-xl py-3.5 text-xs font-bold uppercase tracking-[0.14em] text-white shadow-lg shadow-black/10 transition-all duration-200 hover:opacity-90 hover:shadow-xl active:scale-[0.98] disabled:opacity-70"
      >
        {phase === 'loading' ? 'Enviando...' : `Contactar con ${agency.nombre_comercial}`}
      </button>
    </form>
  );
}
