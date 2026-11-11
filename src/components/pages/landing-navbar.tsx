import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useUI } from '@/context/UIContext';

// El mismo menú en todas las páginas y en todo momento: no cambia de tamaño,
// fondo ni posición al hacer scroll, y el logo siempre lleva a la home.
export function LandingNavbar() {
  const [open, setOpen] = React.useState(false);
  const { isContactModalOpen } = useUI();
  const homeHref = '/';

  const links = [
    { label: 'Servicios', href: '/servicios' },
    { label: 'Calculadora ROI', href: '/calculadora-roi' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Inmobiliaria de tu zona', href: '/inmobiliarias' },
  ];

  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const isActive = (href: string) => path === href || (href !== '/' && path.startsWith(href + '/'));

  const navigate = (href: string) => {
    if (href.startsWith('/')) {
      window.history.pushState({}, '', href);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  };

  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  React.useEffect(() => {
    if (isContactModalOpen) {
      setOpen(false);
    }
  }, [isContactModalOpen]);

  // El panel móvil va fuera del <header>: el backdrop-blur de la cabecera
  // convierte en su referencia a los hijos `fixed` y el panel quedaba con 2 px.
  return (
    <>
    <header
      className={cn(
        'sticky top-0 z-30 mx-auto w-full border-slate-100 font-sans bg-white/95 shadow-sm backdrop-blur-xl md:top-4 md:max-w-fit md:rounded-md md:border md:shadow-md',
        {
          'pointer-events-none': isContactModalOpen,
          'bg-white': open,
        },
      )}
    >
      <nav
        className="flex h-14 w-full items-center justify-between px-4 md:h-12 md:px-6"
      >
        <button 
          onClick={() => {
            if (window.location.pathname === homeHref) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.history.pushState({}, '', homeHref);
              window.dispatchEvent(new PopStateEvent('popstate'));
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          }}
          aria-label="Ir a la página de inicio de Cosiris"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img src="/assets/logo_orange.png" alt="Cosiris" width="380" height="170" className="h-10 w-auto" />
        </button>
        <div className="hidden items-center gap-1 lg:flex xl:gap-2">
          {links.map((link) => (
            <a
              key={link.label}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'relative rounded-full px-3 text-[13px] font-medium xl:px-4 tracking-tight text-black transition-colors hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-[#FF8000]/60',
                isActive(link.href) && 'bg-orange-50 text-orange-700',
              )}
              aria-current={isActive(link.href) ? 'page' : undefined}
              href={link.href}
              onClick={(e) => { e.preventDefault(); navigate(link.href); }}
            >
              {link.label}
            </a>
          ))}
          {/* <a href="https://homestaging-cosiris.com/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
            Home Staging
          </a> */}
          <Button className="ml-1 rounded-full px-4 shadow-sm shadow-orange-500/20 xl:px-5" onClick={() => window.open('https://crm.cosiris.com/', '_blank', 'noopener noreferrer')}>
            Acceso clientes
          </Button>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <Button className="h-10 rounded-lg px-3 text-[13px]" onClick={() => window.open('https://crm.cosiris.com/', '_blank', 'noopener noreferrer')}>
            Acceso clientes
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-11"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={open}
          >
            <MenuToggleIcon open={open} className="size-5" duration={300} />
          </Button>
        </div>
      </nav>
    </header>

      <div
        className={cn(
          'fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y bg-white lg:hidden',
          open ? 'block' : 'hidden',
        )}
      >
        <div
          data-slot={open ? 'open' : 'closed'}
          className={cn(
            'data-[slot=open]:animate-in data-[slot=open]:zoom-in-95 data-[slot=closed]:animate-out data-[slot=closed]:zoom-out-95 ease-out',
            'flex h-full w-full flex-col justify-between gap-y-2 p-4',
          )}
        >
          <div className="grid gap-y-2">
            {links.map((link) => (
              <a
                key={link.label}
                className={buttonVariants({
                  variant: 'ghost',
                  className: cn(
                    'h-12 justify-start rounded-xl px-4 text-base font-medium text-slate-800',
                    isActive(link.href) && 'bg-orange-50 text-orange-700',
                  ),
                })}
                aria-current={isActive(link.href) ? 'page' : undefined}
                href={link.href}
                onClick={(e) => { e.preventDefault(); navigate(link.href); setOpen(false); }}
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
