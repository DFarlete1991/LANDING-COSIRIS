import { Instagram, Linkedin, Youtube, ChevronRight } from 'lucide-react';

const socialLinks = [
  { icon: Instagram, href: 'https://www.instagram.com/cosiris_marketinginmobiliario', label: 'Instagram' },
  { icon: Linkedin, href: 'https://www.linkedin.com/company/cosiris/', label: 'LinkedIn' },
  { icon: Youtube, href: 'https://www.youtube.com/@cosiris_inv', label: 'YouTube' },
];

const linkGroups = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: '/about' },
      { label: 'How It Works', href: '/como-funciona' },
      { label: 'Contact', href: '/contacto' },
      { label: 'Blog', href: '/blog' },
      { label: 'Partners', href: '/partners' },
    ],
  },
  {
    title: 'Services',
    links: [
      { label: 'Sell your Property', href: '/vender' },
      { label: 'Find an Agency', href: '/inmobiliarias' },
      { label: 'Property Valuation', href: '/tasacion' },
      { label: 'Real Estate Marketing', href: '/marketing' },
      { label: 'Mortgage Advice', href: '/hipotecas' },
    ],
  },
  {
    title: 'For Agencies',
    links: [
      { label: 'Lead Generation', href: '/captacion_inmobiliarias' },
      { label: 'Digital Marketing', href: '/marketing-digital' },
      { label: 'CRM', href: '/crm' },
      { label: 'Social Media', href: '/social-media' },
      { label: 'Become a Partner', href: '/registro' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacidad' },
      { label: 'Cookies', href: '/cookies' },
      { label: 'Terms', href: '/terminos-condiciones' },
      { label: 'Legal Notice', href: '/aviso-legal' },
      { label: 'Accessibility', href: '/accesibilidad' },
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
              The network that connects property owners with the best real estate agencies across Spain.
            </p>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} viewBox="0 0 20 20" className="h-3.5 w-3.5 fill-[#FF7A00]">
                    <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.51.91-5.32L2.27 6.62l5.34-.78L10 1z" />
                  </svg>
                ))}
                <span className="ml-1 text-sm font-semibold text-white/80">4.9</span>
                <span className="text-sm text-white/30">Satisfaction</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-white/40">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  650+ Verified Agencies
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  30,000+ Monthly Visitors
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                  Spain Coverage
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
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* SECTION 3 — SEO AREA */}
        <div className="mt-16 border-t border-white/5 pt-14 lg:mt-20 lg:pt-16">
          <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-white/30">Explore Agencies Across Spain</h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/40">
            Discover verified real estate agencies in the main cities of Spain. Find experienced professionals in your area and connect directly with trusted local experts.
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
            View All Cities
            <ChevronRight size={14} />
          </a>
        </div>
      </div>

      {/* SECTION 4 — BOTTOM BAR */}
      <div className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-5 sm:flex-row lg:px-8">
          <p className="text-[12px] text-white/25">
            © {currentYear} Cosiris. Helping thousands of people find trusted real estate agencies.
          </p>
          <p className="text-[12px] text-white/20">
            Connecting Spain&rsquo;s Real Estate Network
          </p>
        </div>
      </div>
    </footer>
  );
}
