import { Instagram, Linkedin, Youtube, ChevronRight } from 'lucide-react';
import { COOKIE_PREFERENCES_EVENT } from './CookieConsentBanner';

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/cosiris_marketinginmobiliario', label: 'Instagram' },
  { icon: Linkedin, href: 'https://www.linkedin.com/company/cosiris/', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://www.youtube.com/@cosiris_inv', label: 'YouTube' },
];

const linkGroups = [
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Nosotros', href: '/about' },
      { label: 'Cómo Funciona', href: '/como-funciona' },
      { label: 'Contacto', href: '/contacto' },
      { label: 'Blog', href: '/blog' },
      { label: 'Colaboradores', href: '/partners' },
    ],
  },
  {
    title: 'Servicios',
    links: [
      { label: 'Vender tu Propiedad', href: '/vender' },
      { label: 'Buscar Inmobiliaria', href: '/inmobiliarias' },
      { label: 'Valoración de Propiedad', href: '/tasacion' },
      { label: 'Marketing Inmobiliario', href: '/marketing' },
      { label: 'Asesoría Hipotecaria', href: '/hipotecas' },
    ],
  },
  {
    title: 'Para Inmobiliarias',
    links: [
      { label: 'Generación de Leads', href: '/captacion_inmobiliarias' },
      { label: 'Marketing Digital', href: '/marketing-digital' },
      { label: 'CRM', href: '/crm' },
      { label: 'Redes Sociales', href: '/social-media' },
      { label: 'Hazte Partner', href: '/registro' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Política de Privacidad', href: '/privacidad' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Términos y Condiciones', href: '/terminos-condiciones' },
      { label: 'Aviso Legal', href: '/aviso-legal' },
      { label: 'Accesibilidad', href: '/accesibilidad' },
    ],
  },
];

const cities = [
  'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Málaga',
  'Murcia', 'Alicante', 'Granada', 'Córdoba', 'Zaragoza', 'Gijón',
  'Santander', 'Palma', 'Valladolid', 'Salamanca', 'Vigo', 'A Coruña',
  'Elche', 'Badalona', 'Oviedo', 'Terrassa', 'Cartagena',
];

function handleNav(href: string) {
  if (href.startsWith('/')) {
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#050505] relative z-[100] w-full">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.4fr_2fr] lg:gap-16">

          {/* SECTION 1 — BRAND */}
          <div className="max-w-sm">
            <img src="/assets/logo_orange.png" alt="Cosiris" className="h-12 w-auto" />
            <p className="mt-5 text-sm leading-relaxed text-white/40">
              La red que conecta a propietarios con las mejores inmobiliarias de España.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  Inmobiliarias verificadas
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  Cobertura en toda España
                </span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  aria-label={link.label}
                  className="text-white/20 transition-all duration-200 hover:text-white/70"
                >
                  <link.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* SECTION 2 — NAVIGATION */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {linkGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">{group.title}</h3>
                <div className="mt-3 h-px w-6 bg-white/10" />
                <ul className="mt-4 space-y-3">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        onClick={(e) => { e.preventDefault(); handleNav(link.href); }}
                        className="relative text-sm text-white/50 transition-colors duration-200 hover:text-white/90"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                  {group.title === 'Legal' && (
                    <li>
                      <button
                        type="button"
                        onClick={() => window.dispatchEvent(new Event(COOKIE_PREFERENCES_EVENT))}
                        className="relative text-left text-sm text-white/50 transition-colors duration-200 hover:text-white/90"
                      >
                        Configurar cookies
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3 — SEO AREA */}
        <div className="mt-16 border-t border-white/5 pt-14 lg:mt-20 lg:pt-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">Explora Inmobiliarias en Toda España</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/40">
            Descubre inmobiliarias verificadas en las principales ciudades de España. Encuentra profesionales con experiencia en tu zona y conecta directamente con expertos locales de confianza.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {cities.map((city) => (
              <a
                key={city}
                href={`/inmobiliarias?q=${city}`}
                onClick={(e) => { e.preventDefault(); handleNav(`/inmobiliarias?q=${city}`); }}
                className="rounded-full border border-white/8 bg-white/5 px-3.5 py-1.5 text-[12px] font-medium text-white/40 transition-all duration-200 hover:border-[#FF7A00]/30 hover:bg-[#FF7A00]/8 hover:text-white/80"
              >
                {city}
              </a>
            ))}
          </div>
          <a
            href="/inmobiliarias"
            onClick={(e) => { e.preventDefault(); handleNav('/inmobiliarias'); }}
            className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-white/40 transition-colors duration-200 hover:text-[#FF7A00]"
          >
            Ver Todas las Ciudades
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

      {/* SECTION 4 — BOTTOM BAR */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row lg:px-8">
          <p className="text-[12px] text-white/25">
            © {currentYear} Cosiris. Todos los derechos reservados.
          </p>
          <p className="text-[12px] text-white/20">
            La red inmobiliaria de confianza en España
          </p>
        </div>
      </div>
    </footer>
  );
}
