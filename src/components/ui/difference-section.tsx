import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { navigateTo } from '@/lib/utils';

// Cierre de la home: la calculadora como siguiente paso y, al lado, el contacto.
export function DifferenceSection() {
  const { openContactModal } = useUI();

  return (
    <section className="relative mx-auto mb-16 w-[calc(100%-2rem)] max-w-[97.5rem] overflow-hidden rounded-[2rem] bg-[#FF8000] px-5 py-16 text-center text-black md:mb-24 md:w-[calc(100%-5rem)] md:rounded-[3rem] md:py-24">
      <svg aria-hidden="true" viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full">
        {[
          { rx: 34, ry: 40 },
          { rx: 46, ry: 47 },
        ].map((r) => (
          <ellipse key={r.rx} cx="50" cy="50" rx={r.rx} ry={r.ry} fill="none" stroke="#000000" strokeOpacity="0.14" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>

      <motion.div
        className="relative mx-auto flex max-w-3xl flex-col items-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      >
        <p className="text-sm font-bold">Calculadora ROI</p>
        <h2 className="mt-2 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] md:text-5xl">Calcula tu plan de captación en 4 pasos</h2>
        <p className="mt-4 max-w-xl text-base font-medium leading-relaxed md:text-lg">Elige tu plan y mira los leads, captaciones, ventas y retorno estimados.</p>

        <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row md:mt-8">
          <a
            href="/calculadora-roi"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('/calculadora-roi');
            }}
            className="group inline-flex min-h-12 items-center gap-2 rounded-lg bg-black px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-neutral-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF8000]"
          >
            Abrir la calculadora
            <ArrowRight size={18} className="transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5" />
          </a>
          <button
            type="button"
            onClick={() => openContactModal({ sourceContext: 'difference_cta' })}
            className="inline-flex min-h-12 cursor-pointer items-center rounded-lg border-2 border-black px-7 text-sm font-bold text-black transition-[background-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:bg-black hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF8000]"
          >
            Solicita más información
          </button>
        </div>

        <p className="mt-5 text-sm font-semibold">Sin compromiso · Respuesta en menos de 24&nbsp;h</p>

        <nav aria-label="Más de Cosiris" className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-1">
          {[
            { label: 'Servicios', href: '/servicios' },
            { label: 'Nosotros', href: '/nosotros' },
          ].map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={(e) => {
                e.preventDefault();
                navigateTo(l.href);
              }}
              className="inline-flex min-h-11 items-center text-sm font-bold text-black underline underline-offset-4 hover:no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black"
            >
              {l.label}
            </a>
          ))}
        </nav>
      </motion.div>
    </section>
  );
}
