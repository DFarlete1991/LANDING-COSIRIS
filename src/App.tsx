import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import LandingPages from '@/components/pages/landing-pages';
import IntroScreen from '@/components/IntroScreen';
import ContactModal from './components/ContactModal';
import { AvisoLegalPage } from './components/legal/AvisoLegalPage';
import { TerminosCondicionesPage } from './components/legal/TerminosCondicionesPage';
import { PrivacidadPage } from './components/legal/PrivacidadPage';
import { CookiesPage } from './components/legal/CookiesPage';
import { NosotrosPage } from './components/pages/NosotrosPage';
import { ServiciosPage } from './components/pages/ServiciosPage';
import { VenderPage } from './components/pages/VenderPage';
import { ValoracionPage } from './components/pages/ValoracionPage';
import { CaptacionInmobiliariasPage } from './components/pages/CaptacionInmobiliariasPage';
import { GraciasVenderPage } from './components/pages/GraciasVenderPage';
import { GraciasPage } from './components/pages/GraciasPage';
import { BuscadorInmobiliariasPage } from './components/pages/BuscadorInmobiliariasPage';
import { ValorarPropiedadPage } from './components/pages/ValorarPropiedadPage';
import { InmobiliariaPerfilPage } from './components/pages/InmobiliariaPerfilPage';
import { PlanesInmobiliariasPage } from './components/pages/PlanesInmobiliariasPage';
import { RegistroInmobiliariaPage } from './components/pages/RegistroInmobiliariaPage';
import { InmobiliariasProvider } from './context/InmobiliariasContext';

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>;
  }
}

const standaloneRoutes: Record<string, React.ComponentType> = {
  '/aviso-legal': AvisoLegalPage,
  '/terminos-condiciones': TerminosCondicionesPage,
  '/privacidad': PrivacidadPage,
  '/cookies': CookiesPage,
  '/nosotros': NosotrosPage,
  '/servicios': ServiciosPage,
  '/valoratuvivienda': VenderPage,
  '/vendetuvivienda': ValoracionPage,
  '/vendetuvivienda/forms': ValoracionPage,
  '/captacion_inmobiliarias': CaptacionInmobiliariasPage,
  '/captaci%C3%B3n_inmobiliarias': CaptacionInmobiliariasPage,
  '/gracias-vender': GraciasVenderPage,
  '/gracias': GraciasPage,
};

export default function App() {
  const [introDone, setIntroDone] = useState(false);
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [currentLocationKey, setCurrentLocationKey] = useState(`${window.location.pathname}${window.location.search}`);

  useEffect(() => {
    const onLocationChange = () => {
      setCurrentPath(window.location.pathname);
      setCurrentLocationKey(`${window.location.pathname}${window.location.search}`);
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      onLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      onLocationChange();
    };

    const onPopState = () => onLocationChange();
    window.addEventListener('popstate', onPopState);

    return () => {
      window.removeEventListener('popstate', onPopState);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPath]);

  useEffect(() => {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: `${window.location.pathname}${window.location.search}`,
      page_title: document.title,
      page_location: window.location.href,
    });
  }, [currentLocationKey]);

  // Estas dos van ANTES del prefijo genérico /inmobiliarias/:id — si no,
  // "planes"/"registro" se interpretarían como un id de inmobiliaria.
  if (currentPath === '/inmobiliarias/planes') {
    return (
      <>
        <PlanesInmobiliariasPage />
        <ContactModal />
      </>
    );
  }

  if (currentPath === '/inmobiliarias/registro') {
    return <RegistroInmobiliariaPage />;
  }

  if (currentPath === '/inmobiliarias/valorar') {
    return (
      <InmobiliariasProvider>
        <ValorarPropiedadPage />
        <ContactModal />
      </InmobiliariasProvider>
    );
  }

  if (currentPath.startsWith('/inmobiliarias/')) {
    const agencyId = decodeURIComponent(currentPath.slice('/inmobiliarias/'.length));
    return (
      <InmobiliariasProvider>
        <InmobiliariaPerfilPage id={agencyId} />
        <ContactModal />
      </InmobiliariasProvider>
    );
  }

  if (currentPath === '/inmobiliarias') {
    return (
      <InmobiliariasProvider>
        <BuscadorInmobiliariasPage />
        <ContactModal />
      </InmobiliariasProvider>
    );
  }

  const StandalonePage = standaloneRoutes[currentPath];
  if (StandalonePage) return (
    <>
      <StandalonePage />
      <ContactModal />
    </>
  );

  return (
    <main className="font-sans bg-white text-ink antialiased">
      {!introDone && <IntroScreen onComplete={() => setIntroDone(true)} />}

      <AnimatePresence mode="wait">
        {introDone && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <LandingPages />
          </motion.div>
        )}
      </AnimatePresence>

      <ContactModal />
    </main>
  );
}
