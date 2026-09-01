import { useEffect, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import ContactModal from './components/ContactModal';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { InmobiliariasProvider } from './context/InmobiliariasContext';
import { parseAgencyProfilePath } from '@/lib/agency-url';
import { captureAttribution } from '@/lib/utm';
import { applyStoredConsentOnLoad } from '@/lib/cookieConsent';

// Cada página se descarga solo cuando se visita esa ruta, en vez de que
// TODAS (mapas de Leaflet, three.js, formularios de registro, etc.) vayan
// en el bundle inicial de cualquier página, incluidas las de campaña como
// /valoratuvivienda y /vendetuvivienda.
const LandingPages = lazy(() => import('@/components/pages/landing-pages'));
const IntroScreen = lazy(() => import('@/components/IntroScreen'));
const AvisoLegalPage = lazy(() => import('./components/legal/AvisoLegalPage').then((m) => ({ default: m.AvisoLegalPage })));
const TerminosCondicionesPage = lazy(() => import('./components/legal/TerminosCondicionesPage').then((m) => ({ default: m.TerminosCondicionesPage })));
const PrivacidadPage = lazy(() => import('./components/legal/PrivacidadPage').then((m) => ({ default: m.PrivacidadPage })));
const CookiesPage = lazy(() => import('./components/legal/CookiesPage').then((m) => ({ default: m.CookiesPage })));
const NosotrosPage = lazy(() => import('./components/pages/NosotrosPage').then((m) => ({ default: m.NosotrosPage })));
const ServiciosPage = lazy(() => import('./components/pages/ServiciosPage').then((m) => ({ default: m.ServiciosPage })));
const VenderPage = lazy(() => import('./components/pages/VenderPage').then((m) => ({ default: m.VenderPage })));
const ValoracionPage = lazy(() => import('./components/pages/ValoracionPage').then((m) => ({ default: m.ValoracionPage })));
const CaptacionInmobiliariasPage = lazy(() => import('./components/pages/CaptacionInmobiliariasPage').then((m) => ({ default: m.CaptacionInmobiliariasPage })));
const GraciasVenderPage = lazy(() => import('./components/pages/GraciasVenderPage').then((m) => ({ default: m.GraciasVenderPage })));
const GraciasPage = lazy(() => import('./components/pages/GraciasPage').then((m) => ({ default: m.GraciasPage })));
const BuscadorInmobiliariasPage = lazy(() => import('./components/pages/BuscadorInmobiliariasPage').then((m) => ({ default: m.BuscadorInmobiliariasPage })));
const ValorarPropiedadPage = lazy(() => import('./components/pages/ValorarPropiedadPage').then((m) => ({ default: m.ValorarPropiedadPage })));
const InmobiliariaPerfilPage = lazy(() => import('./components/pages/InmobiliariaPerfilPage').then((m) => ({ default: m.InmobiliariaPerfilPage })));
const PlanesInmobiliariasPage = lazy(() => import('./components/pages/PlanesInmobiliariasPage').then((m) => ({ default: m.PlanesInmobiliariasPage })));
const RegistroInmobiliariaPage = lazy(() => import('./components/pages/RegistroInmobiliariaPage').then((m) => ({ default: m.RegistroInmobiliariaPage })));

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

  // Solo al cargar la página (no en cada cambio de ruta interna): guarda los
  // UTM/click-ids de la URL de entrada para que los formularios de leads
  // puedan adjuntarlos aunque el envío ocurra varias páginas después.
  useEffect(() => {
    captureAttribution();
    applyStoredConsentOnLoad();
  }, []);

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
        <Suspense fallback={null}>
          <PlanesInmobiliariasPage />
        </Suspense>
        <ContactModal />
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/inmobiliarias/registro') {
    return (
      <>
        <Suspense fallback={null}>
          <RegistroInmobiliariaPage />
        </Suspense>
        <CookieConsentBanner />
      </>
    );
  }

  if (currentPath === '/inmobiliarias/valorar') {
    return (
      <InmobiliariasProvider>
        <Suspense fallback={null}>
          <ValorarPropiedadPage />
        </Suspense>
        <ContactModal />
        <CookieConsentBanner />
      </InmobiliariasProvider>
    );
  }

  // Perfil público: /inmobiliarias-en-<ciudad>/<nombre-comercial>. Sin el
  // segundo segmento (alguien recortó la URL a mano) todavía no hay página
  // por ciudad, así que se cae al directorio en vez de dar un 404.
  const profilePath = parseAgencyProfilePath(currentPath);
  if (profilePath) {
    return (
      <InmobiliariasProvider>
        <Suspense fallback={null}>
          {profilePath.slug ? (
            <InmobiliariaPerfilPage city={profilePath.city} slug={profilePath.slug} />
          ) : (
            <BuscadorInmobiliariasPage />
          )}
        </Suspense>
        <ContactModal />
        <CookieConsentBanner />
      </InmobiliariasProvider>
    );
  }

  // Formato anterior /inmobiliarias/<uuid>: se mantiene vivo porque ya se
  // compartieron enlaces así (WhatsApp, campañas) y no pueden romperse.
  if (currentPath.startsWith('/inmobiliarias/')) {
    const agencyId = decodeURIComponent(currentPath.slice('/inmobiliarias/'.length));
    return (
      <InmobiliariasProvider>
        <Suspense fallback={null}>
          <InmobiliariaPerfilPage id={agencyId} />
        </Suspense>
        <ContactModal />
        <CookieConsentBanner />
      </InmobiliariasProvider>
    );
  }

  if (currentPath === '/inmobiliarias') {
    return (
      <InmobiliariasProvider>
        <Suspense fallback={null}>
          <BuscadorInmobiliariasPage />
        </Suspense>
        <ContactModal />
        <CookieConsentBanner />
      </InmobiliariasProvider>
    );
  }

  const StandalonePage = standaloneRoutes[currentPath];
  if (StandalonePage) return (
    <>
      <Suspense fallback={null}>
        <StandalonePage />
      </Suspense>
      <ContactModal />
      <CookieConsentBanner />
    </>
  );

  return (
    <main className="font-sans bg-white text-ink antialiased">
      {!introDone && (
        <Suspense fallback={null}>
          <IntroScreen onComplete={() => setIntroDone(true)} />
        </Suspense>
      )}

      <AnimatePresence mode="wait">
        {introDone && (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <Suspense fallback={null}>
              <LandingPages />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      <ContactModal />
      <CookieConsentBanner />
    </main>
  );
}
