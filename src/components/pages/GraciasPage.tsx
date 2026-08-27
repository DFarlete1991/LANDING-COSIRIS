import { motion, type Variants } from 'framer-motion';
import { Check, Clock, Youtube, ShieldCheck } from 'lucide-react';
import { FormNavbar } from '../ui/form-navbar';
import { useSEO } from '@/lib/seo';

export function GraciasPage() {
  // Página de agradecimiento sin contenido propio para un buscador — no debe
  // indexarse (evita ruido/duplicados en Search Console).
  useSEO({
    path: '/gracias',
    title: 'Solicitud recibida | Cosiris',
    description: 'Hemos recibido tu solicitud. Nuestro equipo se pondrá en contacto contigo en menos de 24 horas.',
    noindex: true,
  });

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    },
  };

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30 flex flex-col items-center">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70"></div>
      
      <FormNavbar />

      <main className="z-10 flex-1 flex flex-col items-center justify-center px-4 pt-20 pb-12 w-full max-w-3xl mx-auto min-h-screen">
        
        <motion.div 
          className="w-full flex flex-col items-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Bloque 1: Mensaje de Éxito */}
          <motion.div variants={itemVariants} className="flex flex-col items-center text-center max-w-2xl mb-10">
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }} 
              transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
              className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-orange-100 bg-orange-50 relative"
            >
              <Check size={40} strokeWidth={3} className="text-[#FF8000]" />
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-[#0F172A] mb-4">
              Solicitud recibida con éxito.
            </h1>
            <p className="text-lg text-slate-600 font-medium">
              Hemos activado nuestro protocolo de respuesta. En Cosiris sabemos que en el sector inmobiliario, el tiempo es dinero.
            </p>
          </motion.div>

          {/* Bloque 2: El Compromiso de los 10 Minutos */}
          <motion.div variants={itemVariants} className="w-full max-w-xl bg-white border border-slate-100 rounded-xl shadow-lg shadow-slate-200/50 p-6 md:p-8 mb-10 flex items-start gap-5">
            <div className="mt-1 flex-shrink-0 bg-slate-100 p-3 rounded-full">
              <Clock className="w-6 h-6 text-[#0F172A]" />
            </div>
            <div>
              <p className="text-slate-700 font-medium leading-relaxed">
                Muchas gracias por confiar en nosotros. Nuestro equipo está analizando los datos y <strong className="text-[#0F172A]">te contactaremos en menos de 24 horas.</strong>
              </p>
            </div>
          </motion.div>

          {/* Bloque 3: Mientras Esperas (Inyección de Autoridad) */}
          <motion.div variants={itemVariants} className="w-full max-w-2xl bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 overflow-hidden mb-12">
            <div className="p-8 text-center flex flex-col items-center">
              <div className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-1.5 border border-red-200">
                <Youtube size={14} /> Podcast
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-3">
                Aprende cómo estamos transformando otras inmobiliarias.
              </h2>
              <p className="text-slate-600 mb-8 max-w-lg mx-auto">
                Echa un vistazo a nuestro último Podcast. Hablamos de estrategias reales, sin filtros, sobre cómo captar en el mercado actual.
              </p>
              
              <a 
                href="https://www.youtube.com/@cosiris_inv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#FF0000] px-8 py-4 text-base font-bold text-white transition-all hover:bg-red-700 hover:-translate-y-1 shadow-[0_10px_30px_rgba(255,0,0,0.2)]"
              >
                <Youtube size={20} />
                Ver Podcast
              </a>
            </div>
          </motion.div>

          {/* Bloque 4: Cierre de Confianza */}
          <motion.div variants={itemVariants} className="flex items-center gap-2 text-slate-500 text-sm font-medium">
            <ShieldCheck size={18} className="text-[#FF8000]" />
            <p>Estás en buenas manos. +150 agencias ya han digitalizado su captación con nosotros.</p>
          </motion.div>

        </motion.div>
      </main>
    </div>
  );
}