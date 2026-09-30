import React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { MenuToggleIcon } from '@/components/ui/menu-toggle-icon';
import { useScroll } from '@/components/ui/use-scroll';
import { useUI } from '@/context/UIContext';

export function LandingNavbar({ invertOnScroll = false }: { invertOnScroll?: boolean } = {}) {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);
  const { isContactModalOpen } = useUI();

  // Por defecto el header no tiene fondo propio hasta hacer scroll — pensado
  // para páginas que empiezan con una sección clara. `invertOnScroll` es para
  // páginas con hero oscuro (video, imagen): arranca sólido (fondo blanco,
  // colores normales) para quedar legible sobre el hero, y al hacer scroll
  // pasa al mismo look difuminado que ya usa el resto del sitio.
  const isSolidAtTop = invertOnScroll && !scrolled && !open;

  const links = [
    { label: 'Servicios', href: '/servicios' },
    { label: 'Nosotros', href: '/nosotros' },
    { label: 'Valora tu vivienda', href: '/inmobiliarias/valorar' },
    { label: 'Inmobiliarias en tu zona', href: '/inmobiliarias' },
  ];

  const [path, setPath] = React.useState(() => window.location.pathname);
  React.useEffect(() => {
    const sync = () => setPath(window.location.pathname);
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, []);
  const isActive = (href: string) => path === href || path.startsWith(href + '/');

  const navigate = (href: string) => {
    if (href.startsWith('/') && href !== '/') {
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

  return (
    <header
      className={cn(
        'sticky top-0 z-30 mx-auto w-full md:max-w-fit transition-[filter,background-color,box-shadow] duration-300 md:top-8 md:rounded-md md:ease-out',
        {
          'border-white/25 bg-white/50 shadow-sm backdrop-blur-xl md:top-4 md:border md:shadow-md':
            scrolled && !open,
          'border-slate-100 bg-white shadow-sm md:top-4 md:border md:shadow-md': isSolidAtTop,
          'pointer-events-none': isContactModalOpen,
          'bg-white': open,
        },
      )}
    >
      <nav
        className={cn('flex h-14 w-full items-center justify-between px-4 md:h-12 md:px-6 md:transition-all md:ease-out', {
          'md:px-5': scrolled,
        })}
      >
        <button 
          onClick={() => {
            if (window.location.pathname === '/') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              window.history.pushState({}, '', '/');
              window.dispatchEvent(new PopStateEvent('popstate'));
              window.scrollTo({ top: 0, behavior: 'instant' });
            }
          }}
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img src="/assets/logo_orange.png" alt="Cosiris" width="380" height="170" className="h-10 w-auto" />
        </button>
        <div className="hidden items-center gap-2 md:flex">
          {links.map((link) => (
            <a
              key={link.label}
              className={cn(
                buttonVariants({ variant: 'ghost' }),
                'relative rounded-full px-4 text-[13px] font-medium tracking-tight text-slate-700 transition-colors hover:bg-orange-50 hover:text-orange-700 focus-visible:ring-2 focus-visible:ring-[#FF8000]/60',
                isActive(link.href) && 'bg-orange-50 text-orange-700',
              )}
              aria-current={isActive(link.href) ? 'page' : undefined}
              href={link.href}
              onClick={link.href.startsWith('/') && link.href !== '/' ? (e) => { e.preventDefault(); navigate(link.href); } : undefined}
            >
              {link.label}
            </a>
          ))}
          {/* <a href="https://homestaging-cosiris.com/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
            Home Staging
          </a> */}
          <Button className="ml-1 rounded-full px-5 shadow-sm shadow-orange-500/20" onClick={() => window.open('https://crm.cosiris.com/', '_blank', 'noopener noreferrer')}>
            Acceso Clientes
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={open}
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>

      <div
        className={cn(
          'fixed top-14 right-0 bottom-0 left-0 z-50 flex flex-col overflow-hidden border-y bg-white md:hidden',
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
                onClick={link.href.startsWith('/') && link.href !== '/' ? (e) => { e.preventDefault(); navigate(link.href); setOpen(false); } : undefined}
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            {/* <a href="https://homestaging-cosiris.com/" target="_blank" rel="noopener noreferrer" className={buttonVariants({ variant: 'outline' })}>
            Home Staging
          </a> */}
            <Button className="h-12 w-full rounded-xl text-base" onClick={() => window.open('https://crm.cosiris.com/', '_blank', 'noopener noreferrer')}>
              Acceso Clientes
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
