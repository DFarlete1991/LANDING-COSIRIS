import { useEffect } from 'react';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { PlanCalculator } from '@/components/plan-calculator/PlanCalculator';
import { useUI } from '@/context/UIContext';
import { useSEO } from '@/lib/seo';

export function CalculadoraRoiPage() {
  useSEO({
    path: '/calculadora-roi',
    title: 'Calculadora de tu plan de captación inmobiliaria | Cosiris',
    description: 'Calcula en 4 pasos tu plan de captación de propietarios: permanencia, pack, inversión en Meta Ads y comisión. Ve leads, captaciones, ventas y retorno estimados y descarga tu presupuesto en PDF.',
  });

  const { openContactModal } = useUI();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar />

      <main className="relative overflow-x-clip">
        {/* Mismas líneas guía y halo cálido que los hero del resto de la web */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-y-0 left-4 w-px bg-gradient-to-b from-transparent via-slate-200 to-slate-200 md:left-8" />
          <div className="absolute inset-y-0 right-4 w-px bg-gradient-to-b from-transparent via-slate-200 to-slate-200 md:right-8" />
          <div className="absolute left-1/2 top-0 h-[420px] w-[min(900px,100%)] -translate-x-1/2 rounded-full bg-[#FF8000]/[0.07] blur-3xl" />
        </div>

        <div className="px-4 pb-16 pt-10 md:px-10 md:pb-24 md:pt-24">
          <PlanCalculator />
        </div>

        <section className="mx-4 mb-20 overflow-hidden rounded-2xl bg-[#FF8000] md:mx-auto md:max-w-5xl">
          <div className="relative px-6 py-10 text-center md:px-10 md:py-14">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10" />
            <p className="relative mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-white/80">
              ¿Prefieres que te lo expliquemos?
            </p>
            <h2 className="relative text-2xl font-black tracking-tighter text-white md:text-4xl">
              Un asesor revisa tu plan contigo
            </h2>
            <p className="relative mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
              Te ayudamos con la cuenta publicitaria, la permanencia y el pack que mejor encaja con tu zona.
            </p>
            <button
              onClick={() => openContactModal({ initialServices: ['Captación Ads'], sourceContext: 'calculadora_roi' })}
              className="relative mt-7 inline-flex items-center gap-2 rounded-md bg-white px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-[#FF8000] shadow-md transition-all duration-300 hover:bg-slate-50 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Hablar con un asesor
            </button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
