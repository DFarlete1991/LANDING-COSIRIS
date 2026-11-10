import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getStoredConsent, saveConsent } from '@/lib/cookieConsent';

// Se dispara desde fuera (ver Footer "Configurar cookies") para reabrir el
// panel aunque el usuario ya hubiera decidido antes.
export const COOKIE_PREFERENCES_EVENT = 'cosiris:open-cookie-preferences';

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!getStoredConsent()) setVisible(true);

    const openPreferences = () => {
      const stored = getStoredConsent();
      setAnalytics(stored?.analytics ?? false);
      setMarketing(stored?.marketing ?? false);
      setExpanded(true);
      setVisible(true);
    };
    window.addEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
    return () => window.removeEventListener(COOKIE_PREFERENCES_EVENT, openPreferences);
  }, []);

  const acceptAll = () => {
    saveConsent({ analytics: true, marketing: true });
    setVisible(false);
    setExpanded(false);
  };

  const rejectAll = () => {
    saveConsent({ analytics: false, marketing: false });
    setVisible(false);
    setExpanded(false);
  };

  const confirmSelection = () => {
    saveConsent({ analytics, marketing });
    setVisible(false);
    setExpanded(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-label="Preferencias de cookies"
          className="fixed inset-x-0 bottom-0 z-[200] flex justify-center px-3 pb-3 sm:px-4 sm:pb-4"
        >
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-[0_24px_64px_-12px_rgba(0,0,0,0.35)] sm:p-5">
            <p className="text-[13px] leading-snug text-slate-700 sm:text-sm sm:leading-relaxed">
              Usamos cookies técnicas (siempre activas) y, si nos das permiso, cookies de
              analítica y publicidad. Puedes cambiar tu elección cuando quieras desde
              "Configurar cookies" en el pie de página. Más info en nuestra{' '}
              <a href="/cookies" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#FF8000]">
                Política de Cookies
              </a>
              .
            </p>

            {expanded && (
              <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>
                    <strong className="font-semibold text-neutral-900">Analítica</strong> — Google Tag
                    Manager, Google Analytics, Google Ads
                  </span>
                  <input
                    type="checkbox"
                    checked={analytics}
                    onChange={(e) => setAnalytics(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#FF8000] focus:ring-[#FF8000]/40"
                  />
                </label>
                <label className="flex items-center justify-between gap-3 text-sm text-slate-700">
                  <span>
                    <strong className="font-semibold text-neutral-900">Publicidad</strong> — Meta Pixel
                    (Facebook / Instagram) y píxel de OpenAI (anuncios en ChatGPT)
                  </span>
                  <input
                    type="checkbox"
                    checked={marketing}
                    onChange={(e) => setMarketing(e.target.checked)}
                    className="h-4 w-4 shrink-0 rounded border-slate-300 text-[#FF8000] focus:ring-[#FF8000]/40"
                  />
                </label>
              </div>
            )}

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:justify-end sm:gap-2.5">
              {expanded ? (
                <button
                  type="button"
                  onClick={confirmSelection}
                  className="col-span-3 min-h-11 rounded-md bg-[#FF8000] px-4 text-sm font-bold text-white transition hover:bg-[#E67300]"
                >
                  Guardar preferencias
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setExpanded(true)}
                    className="min-h-11 rounded-md border border-slate-200 px-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 sm:px-4"
                  >
                    Configurar
                  </button>
                  <button
                    type="button"
                    onClick={rejectAll}
                    className="min-h-11 rounded-md border border-slate-200 px-2 text-[13px] font-bold text-slate-700 transition hover:bg-slate-50 sm:px-4"
                  >
                    Rechazar
                  </button>
                  <button
                    type="button"
                    onClick={acceptAll}
                    className="min-h-11 rounded-md bg-[#FF8000] px-2 text-[13px] font-bold text-white transition hover:bg-[#E67300] sm:px-4"
                  >
                    Aceptar todo
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
