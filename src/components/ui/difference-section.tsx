import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useUI } from '@/context/UIContext';

export function DifferenceSection() {
  const { openContactModal } = useUI();

  return (
    <section className="relative flex min-h-[100svh] w-full items-start justify-center overflow-hidden bg-black px-6 pb-20 pt-32 md:px-8 md:pb-24 md:pt-40">
      <motion.div
        className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={{
          hidden: { opacity: 0, y: 20 },
          visible: {
            opacity: 1,
            y: 0,
          },
        }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="inline-flex rounded-full border border-white/15 px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-300">
          comprometidos y sencillos
        </span>

        <h2 className="mt-10 text-[7rem] font-black leading-none tracking-tight text-white sm:text-[9rem] md:text-[11rem]">
          11<span className="text-[#FF8000] rounded-md">años</span>
        </h2>

        <p className="mt-8 text-4xl font-light tracking-tight text-slate-100 md:text-6xl">
          Un equipo acompañando a inmobiliarias.
        </p>

        <p className="mt-8 max-w-4xl text-base font-light leading-relaxed text-slate-400 md:text-2xl md:leading-relaxed">
          operamos con éxito y cercanía en <span className="font-semibold text-white">toda España</span>,
          a través del marketing digital para inmobiliarias de forma comprometida y sencilla.
        </p>

        <button
          onClick={() => openContactModal({ sourceContext: 'difference_cta' })}
          className="mt-16 group inline-flex items-center gap-4 rounded-md bg-[#FF8A00] px-12 py-5 text-sm font-bold uppercase tracking-[0.2em] text-white shadow-[0_20px_50px_rgba(255,138,0,0.35)] transition-all hover:-translate-y-1 hover:bg-[#FF9A26]"
        >
          Contactar con el equipo
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </section>
  );
}
