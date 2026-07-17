import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { LandingNavbar } from './landing-navbar';

export function GraciasVenderPage() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>
      <LandingNavbar />

      <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 pt-10 pb-12 w-full max-w-2xl mx-auto min-h-screen">
        <div className="relative w-full overflow-visible rounded-md border border-slate-100 bg-white shadow-2xl shadow-slate-200/50">
          <div className="p-8 md:p-10 relative">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-10">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border-4 border-orange-100 bg-orange-50">
                <Check size={32} strokeWidth={2.5} className="text-[#FF8000]" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 mb-3 text-center">Solicitud recibida correctamente</h2>
              <p className="text-center text-slate-600 mb-8 max-w-md">
                Muchas gracias por confiar en nosotros. Nuestro equipo está analizando los datos y te contactaremos en menos de 24 horas.
              </p>
              <a href="/" className="inline-flex items-center justify-center rounded-md bg-[#FF8000] px-8 py-4 text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-[#E67300] hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,128,0,0.3)]">
                VOLVER AL INICIO
              </a>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}