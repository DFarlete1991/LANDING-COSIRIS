import { useEffect } from 'react';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { Footer } from '@/components/Footer';
import { RoiCalculator } from '@/components/RoiCalculator';
import { useUI } from '@/context/UIContext';
import { useSEO } from '@/lib/seo';

export function CalculadoraRoiPage() {
  useSEO({
    path: '/calculadora-roi',
    title: 'Calculadora de ROI para captación inmobiliaria | Cosiris',
    description: 'Calcula cuántos leads, captaciones y ventas puede darte una campaña de captación de propietarios y qué retorno te deja. Cálculo orientativo con promedios reales de Cosiris.',
  });

  const { openContactModal } = useUI();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-slate-900 antialiased">
      <LandingNavbar />

      <main className="mx-auto max-w-4xl px-4 pb-20 pt-16 md:px-6 md:pt-24">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.28em] text-[#FF8000]">Calculadora de ROI</p>
        <h1 className="max-w-2xl text-3xl font-black leading-tight tracking-tighter text-slate-900 md:text-5xl">
          La captación es un sistema. Calcula lo que te devuelve.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-600">
          Indica cuántos meses quieres trabajar con nosotros, tu inversión publicitaria y tu comisión media.
        </p>

        <RoiCalculator />

        <div className="mt-12 flex justify-center">
          <button
            onClick={() => openContactModal({ initialServices: ['Captación Ads'], sourceContext: 'calculadora_roi' })}
            className="inline-flex items-center gap-2 rounded-md bg-[#FF8000] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#E67300] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF8000]"
          >
            Quiero esta campaña
          </button>
        </div>
      </main>

      <Footer />
    </div>
  );
}
