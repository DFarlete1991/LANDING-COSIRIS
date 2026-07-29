import { motion } from 'framer-motion';
import { ArrowRight, Check, Megaphone, Share2, Bot, Mail } from 'lucide-react';
import { FormNavbar } from '../ui/form-navbar';
import { SharedLandingSections } from '../ui/shared-landing-sections';
import { navigateTo } from '@/lib/utils';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

const SERVICE_PLANS = [
  {
    icon: Share2,
    name: 'Gestión Redes',
    text: 'Contenido y publicaciones para tus redes sociales, gestionadas por nuestro equipo.',
  },
  {
    icon: Megaphone,
    name: 'Captación Ads',
    text: 'Campañas de anuncios pagados enfocadas en captar propietarios y compradores reales.',
  },
  {
    icon: Mail,
    name: 'Email Marketing',
    text: 'Secuencias automáticas para dar seguimiento a tus leads sin perder ninguno.',
  },
  {
    icon: Bot,
    name: 'Agente IA',
    text: 'Respuesta automática a tus leads por WhatsApp e Instagram, las 24 horas.',
  },
];

const TRIAL_BULLETS = [
  'Tu inmobiliaria aparece en el Directorio Cosiris',
  'Recibes leads reales de personas buscando en tu zona',
  'Panel con tus leads en el CRM de Cosiris',
  'Sin tarjeta de crédito — 30 días gratis',
];

export function PlanesInmobiliariasPage() {
  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-[#FF8000]/30">
      <div className="absolute inset-0 z-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] opacity-70 pointer-events-none" />

      <FormNavbar />

      <main className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-20 pt-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EXPO }}
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FF8000]">Para inmobiliarias</p>
          <h1 className="mt-3 text-3xl font-black leading-[1.1] tracking-[-0.03em] text-[#0F172A] md:text-5xl">
            Haz crecer tu inmobiliaria con Cosiris
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm text-slate-600 md:text-base">
            Directorio público para recibir leads reales, y servicios adicionales de marketing cuando
            quieras escalar.
          </p>
        </motion.div>

        {/* Plan destacado: prueba gratis del directorio */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EXPO, delay: 0.1 }}
          className="relative mx-auto mt-12 max-w-lg overflow-hidden rounded-2xl border border-[#FF8000]/30 bg-gradient-to-br from-[#0F172A] to-[#1a2340] p-8 text-left shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] md:p-10"
        >
          <span className="inline-flex items-center rounded-full bg-[#FF8000]/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[#FF8000]">
            Directorio Cosiris
          </span>
          <h2 className="mt-4 text-2xl font-black tracking-[-0.02em] text-white">Prueba gratis 30 días</h2>
          <ul className="mt-5 space-y-2.5">
            {TRIAL_BULLETS.map((bullet) => (
              <li key={bullet} className="flex items-start gap-2.5 text-sm text-white/80">
                <Check size={16} className="mt-0.5 shrink-0 text-[#FF8000]" />
                {bullet}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigateTo('/inmobiliarias/registro')}
            className="group mt-7 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF8000] py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF8000]/25 transition-all duration-200 hover:bg-[#E67300] hover:shadow-xl hover:shadow-[#FF8000]/30 active:scale-95"
          >
            Prueba Gratis
            <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </motion.div>

        {/* Otros servicios */}
        <div className="mt-16">
          <h3 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] md:text-xl">
            Otros planes cuando quieras dar el siguiente paso
          </h3>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SERVICE_PLANS.map(({ icon: Icon, name, text }, index) => (
              <motion.div
                key={name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, ease: EXPO, delay: index * 0.05 }}
                className="rounded-xl border border-slate-100 bg-white p-5 text-left shadow-sm shadow-slate-900/5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000]">
                  <Icon size={20} />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{name}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{text}</p>
              </motion.div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => navigateTo('/captacion_inmobiliarias')}
            className="mt-6 text-sm font-semibold text-[#FF8000] hover:underline"
          >
            Habla con nosotros sobre estos planes →
          </button>
        </div>
      </main>

      <SharedLandingSections />
    </div>
  );
}
