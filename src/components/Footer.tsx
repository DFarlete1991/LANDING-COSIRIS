import { Instagram, Linkedin, Youtube } from 'lucide-react';

const legalLinks = [
  { label: 'Aviso Legal', href: '/aviso-legal' },
  { label: 'Términos y Condiciones', href: '/terminos-condiciones' },
  { label: 'Política de Privacidad', href: '/privacidad' },
  { label: 'Política de Cookies', href: '/cookies' },
  { label: 'Captación Inmobiliarias', href: '/captacion_inmobiliarias' },
];

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/cosiris_marketinginmobiliario', label: 'Instagram' },
  { icon: Linkedin, href: 'https://www.linkedin.com/company/cosiris/', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://www.youtube.com/@cosiris_inv', label: 'YouTube' },
];

const seoInmobiliariasLinks = [
  'Agencia marketing inmobiliarias',
  '¿Eres una inmobiliaria?',
  'Gestión de redes sociales para inmobiliarias',
  'Captación para inmobiliarias'
];

const seoLocations = [
  'Inmobiliarias en Madrid', 'Inmobiliarias en Barcelona', 'Inmobiliarias en València',
  'Inmobiliarias en Sevilla', 'Inmobiliarias en Bilbao', 'Inmobiliarias en Málaga',
  'Inmobiliarias en Alicante', 'Inmobiliarias en Zaragoza', 'Inmobiliarias en Murcia',
  'Inmobiliarias en Palma', 'Agentes en Valladolid', 'Agentes en Vigo',
  'Agentes en Gijón', 'Agentes en A Coruña', 'Agentes en Granada',
  'Agentes en Elche', 'Agentes en Badalona', 'Agentes en Oviedo',
  'Agentes en Terrassa', 'Agentes en Cartagena'
];

const seoParticularesLinks = [
  'Tasación de vivienda', '¿Quieres vender tu casa?', 'Valorar de mi vivienda',
  '¿invertir en vivienda?', '¿Cuánto vale mi casa?', '¿eres un propietario particular?',
  '¿inmuebles con inquilinos?', 'Vender mi piso alquilado'
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith('/')) {
      e.preventDefault();
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <footer className="bg-black relative z-[100] w-full">
      {/* Top bar: logo + socials */}
      <div className="mx-auto max-w-7xl px-6 py-5 lg:px-8">
        <div className="flex items-center justify-between">
          <img src="/assets/logo_orange.png" alt="Cosiris" className="h-10 w-auto" />
          <div className="flex items-center gap-5">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                aria-label={link.label}
                className="text-white/50 transition-colors hover:text-white"
              >
                <link.icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar: legal links + copyright */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-4 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-[11px] text-white/30">
              © {currentYear} Cosiris. Todos los derechos reservados.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
              {legalLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleLinkClick(e, link.href)}
                  className="text-[11px] text-white/40 transition-colors hover:text-white/80"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SEO Section (Hidden / Micro) */}
      <div className="border-t border-white/5 py-4 bg-black">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-[9px] text-white/20">
            {/* Servicios Inmobiliarias */}
            <div className="flex flex-col gap-1.5">
              <span className="font-semibold text-white/30 uppercase tracking-wider mb-1">Inmobiliarias</span>
              {seoInmobiliariasLinks.map((label, idx) => (
                <a
                  key={idx}
                  href="/captacion_inmobiliarias"
                  onClick={(e) => handleLinkClick(e, '/captacion_inmobiliarias')}
                  className="hover:text-white/40 transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
                <span className="w-full font-semibold text-white/30 uppercase tracking-wider mb-1">Agencias en España</span>
                {seoLocations.map((loc, idx) => (
                  <a
                    key={idx}
                    href="/captacion_inmobiliarias"
                    onClick={(e) => handleLinkClick(e, '/captacion_inmobiliarias')}
                    className="hover:text-white/40 transition-colors"
                  >
                    {loc}
                  </a>
                ))}
              </div>
            </div>

            {/* Particulares */}
            <div className="flex flex-col gap-1.5 lg:col-start-3">
              <span className="font-semibold text-white/30 uppercase tracking-wider mb-1">Particulares</span>
              {seoParticularesLinks.map((label, idx) => (
                <a
                  key={idx}
                  href="/vendetuvivienda"
                  onClick={(e) => handleLinkClick(e, '/vendetuvivienda')}
                  className="hover:text-white/40 transition-colors"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
