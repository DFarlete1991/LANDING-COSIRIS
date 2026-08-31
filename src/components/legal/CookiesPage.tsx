import { LegalPageLayout } from './LegalPageLayout';
import { COOKIE_PREFERENCES_EVENT } from '../CookieConsentBanner';

export function CookiesPage() {
  return (
    <LegalPageLayout title="Política de Cookies" path="/cookies">
      <p>
        www.cosiris.com utiliza cookies técnicas, necesarias para el funcionamiento del
        sitio, y opcionalmente cookies de analítica y publicidad de terceros. Estas
        últimas <strong>solo se instalan si usted da su consentimiento expreso</strong> a
        través del panel que aparece en su primera visita. Puede cambiar su decisión en
        cualquier momento pulsando{' '}
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}
          className="underline hover:text-[#FF8000]"
        >
          "Configurar cookies"
        </button>{' '}
        en el pie de página.
      </p>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">POLÍTICA DE COOKIES</h2>
        <p>
          En cumplimiento de lo previsto en el artículo 22.2 de la Ley 34/2002, de 11 de
          julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico
          (LSSI-CE), esta Política de Cookies informa sobre qué cookies utiliza este sitio
          web, con qué finalidad, y cómo gestionar su consentimiento.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">¿Qué son las cookies?</h2>
        <p>
          Las cookies son pequeños archivos de texto que un sitio web envía al navegador
          del usuario y que permiten, entre otras cosas, reconocer al usuario en visitas
          posteriores o recopilar información estadística sobre su navegación.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">Cookies propias (técnicas)</h2>
        <p>
          Son las estrictamente necesarias para el funcionamiento del sitio y no requieren
          consentimiento, al estar excluidas del ámbito del art. 22.2 LSSI-CE: permiten,
          por ejemplo, recordar su elección sobre esta misma Política de Cookies o
          mantener el estado de navegación dentro del sitio.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">Cookies de terceros (requieren su consentimiento)</h2>
        <p>Solo se activan si usted las acepta, de forma separada por categoría:</p>
        <ul className="list-disc pl-6 space-y-3 mt-3">
          <li>
            <strong>Analítica — Google Tag Manager, Google Analytics y Google Ads:</strong>{' '}
            permiten medir el tráfico del sitio y el resultado de nuestras campañas.
            Prestados por Google Ireland Limited. Más información en la{' '}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#FF8000]"
            >
              Política de Privacidad de Google
            </a>
            .
          </li>
          <li>
            <strong>Publicidad — Meta Pixel:</strong> permite medir el resultado de
            nuestros anuncios en Facebook e Instagram. Prestado por Meta Platforms
            Ireland Ltd. Más información en la{' '}
            <a
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-[#FF8000]"
            >
              Política de Privacidad de Meta
            </a>
            .
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">Cómo cambiar su consentimiento</h2>
        <p>
          Puede aceptar, rechazar o personalizar estas cookies en cualquier momento desde
          el enlace{' '}
          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}
            className="underline hover:text-[#FF8000]"
          >
            "Configurar cookies"
          </button>{' '}
          en el pie de página de cualquier página del sitio. También puede bloquear
          cookies desde la configuración de su navegador, aunque eso afecta a todos los
          sitios web, no solo a este.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">Cambios en la política de cookies</h2>
        <p>
          Es posible que esta Política de Cookies se actualice para reflejar cambios en
          las cookies realmente utilizadas. Le recomendamos revisarla periódicamente.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-slate-900 mt-8 mb-2">Contacto</h2>
        <p>
          Para cualquier duda sobre esta Política de Cookies, puede escribirnos a{' '}
          comercial@cosiris.com.
        </p>
      </section>
    </LegalPageLayout>
  );
}
