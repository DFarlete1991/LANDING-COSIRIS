import { Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];

export function WhyChooseCosiris() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 py-16 md:py-24">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-900 md:text-4xl">
          ¿Por qué elegir Cosiris?
        </h2>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          { 
            title: 'Valocación Precisa', 
            subtitle: 'Trabajamos con los datos de las mejores agencias de confianza de tu zona' 
          },
          { 
            title: 'SIN COMPROMISO', 
            subtitle: 'El servicio es gratuito. Tú decides si sigues adelante.' 
          },
          { 
            title: 'DATOS Y CONTACTO PERSONALIZADO', 
            subtitle: 'Hablamos contigo rápidamente y te asesoramos.' 
          }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            className="group flex flex-col items-center text-center rounded-2xl border border-slate-100 bg-white p-8 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] transition-all duration-300 hover:border-[#FF8000]/20 hover:shadow-xl hover:-translate-y-1"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: EXPO }}
          >
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-[#FF8000] transition-colors group-hover:bg-[#FF8000] group-hover:text-white">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <h3 className="mb-3 text-lg font-extrabold tracking-tight text-slate-900">{item.title}</h3>
            <p className="text-sm font-medium leading-relaxed text-slate-500 uppercase">{item.subtitle}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function HowItWorks({ onCTAClick }: { onCTAClick: () => void }) {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-16 md:py-24">
      <div className="text-center mb-16">
        <h2 className="text-3xl font-black tracking-[-0.03em] text-slate-900 md:text-4xl">
          ¿Cómo funciona?
        </h2>
      </div>
      <div className="flex flex-col space-y-10 relative before:absolute before:inset-0 before:ml-[31px] md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:-translate-x-px before:bg-gradient-to-b before:from-slate-100 before:via-slate-200 before:to-slate-100">
        {[
          { 
            title: 'RELLENA EL FORMULARIO', 
            desc: 'Nos dejas tus datos y los detalles básicos de tu vivienda en pocos clics.' 
          },
          { 
            title: 'ANÁLISIS DE DATOS AUTOMATIZADO Y PERSONALIZADO', 
            desc: 'Validamos qué perfil de agencia encaja mejor con tu propiedad para maximizar el resultado.' 
          },
          { 
            title: 'LOS MEJORES PROFESIONALES ESPECIALIZADOS', 
            desc: 'Una agencia experimentada de nuestra red validada te contactará rápidamente.' 
          }
        ].map((item, i) => (
          <motion.div 
            key={i} 
            className="relative flex items-start gap-6 md:justify-between md:odd:flex-row-reverse group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.6, delay: i * 0.15, ease: EXPO }}
          >
            <div className="hidden md:block md:w-[45%]"></div>
            
            <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white border-[4px] border-orange-50 shadow-sm transition-colors group-hover:border-[#FF8000]/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF8000] text-white font-black text-lg shadow-md">
                {i + 1}
              </div>
            </div>

            <div className="pt-2 pb-6 md:w-[45%] md:pt-3">
              <h3 className="text-xl font-extrabold text-slate-900 mb-2 md:text-left uppercase tracking-tight">{item.title}</h3>
              <p className="text-sm font-medium leading-relaxed text-slate-500 md:text-left">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div 
        className="mt-16 flex justify-center"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <button 
          onClick={onCTAClick} 
          className="group flex flex-row items-center justify-center gap-2 rounded-md bg-[#FF8000] px-8 py-5 text-[15px] font-bold uppercase tracking-wider text-white transition-all duration-300 hover:bg-[#E67300] hover:shadow-[0_8px_30px_-5px_rgba(255,128,0,0.4)] active:scale-[0.98]"
        >
          Rellena el formulario y empieza ya
          <ArrowRight size={18} className="translate-x-0 transition-transform group-hover:translate-x-1" />
        </button>
      </motion.div>
    </section>
  );
}