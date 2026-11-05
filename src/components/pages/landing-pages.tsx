import { MotionConfig } from 'framer-motion';
import { LandingNavbar } from '@/components/pages/landing-navbar';
import { AuthorityPage } from '@/components/pages/page-authority';
import { Footer } from '@/components/Footer';
import { TrustVideoWall } from '@/components/ui/trust-video-wall';
import { EvolutionSection } from '@/components/ui/evolution-story';
import { AboutSection, ClientsSection, FaqSection, FloatingHelpButton, ServicesSection } from '@/components/ui/home-sections';
import { ProcessSection } from '@/components/ui/process-story';
import { useSEO } from '@/lib/seo';
import { useFluidPage } from '@/lib/use-fluid-page';

// Orden del guion de contenido de Cosiris:
// 1. qué es Cosiris + logos y cifras, 2. evolución del sector, 3. del anuncio a la
// captación, 4. vídeo y servicios, 5. testimonios, 6. equipo, 7. dudas,
// 8. calculadora y contacto, con un botón flotante de dudas durante todo el
// recorrido.
export default function LandingPages() {
  useFluidPage();

  // index.html ya trae el título/descripción correctos para "/" — aquí solo
  // se añade el canonical explícito, que el HTML estático no define.
  useSEO({
    path: '/',
    title: 'Marketing y captación para inmobiliarias | Cosiris',
    description: 'Cosiris | Agencia de marketing especializada en el sector inmobiliario. Captación y digitalización automatizada.',
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="relative flex w-full flex-col bg-white text-[#0A0A0A]" style={{ fontFamily: "'Sora', 'Montserrat', system-ui, sans-serif" }}>
        <LandingNavbar />

        <main className="relative z-20 grow">
          <TrustVideoWall />
          <EvolutionSection />
          {/* El panel negro tiene esquinas redondeadas: cada mitad del fondo continúa
              el color de la sección vecina. */}
          <div className="bg-[linear-gradient(#FFF8F1_50%,#FFFFFF_50%)]">
            <ProcessSection />
          </div>
          <ServicesSection />
          <ClientsSection />
          <AboutSection />
          <FaqSection />
          <AuthorityPage />
          <Footer />
        </main>

        <FloatingHelpButton />
      </div>
    </MotionConfig>
  );
}
