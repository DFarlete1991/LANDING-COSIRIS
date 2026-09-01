import { useRef } from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { LogoCloud } from '@/components/ui/logo-cloud-3';
import { HeroBadge } from '@/components/ui/hero-badge';
import { HeroTitle } from '@/components/ui/hero-title';
import { HeroSubtitle } from '@/components/ui/hero-subtitle';
import { useUI } from '@/context/UIContext';

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function HeroSection({ hideButton = false }: { hideButton?: boolean } = {}) {
  const { openContactModal } = useUI();

  return (
    <section className="relative mx-auto w-full max-w-5xl px-4">
      <div className="relative flex flex-col items-center justify-center gap-5 py-14 md:py-16">
        <HeroBadge text="¡Nuevos servicios disponibles!" />
        <HeroTitle drawUnderline />
        <HeroSubtitle text="La Digitalización ya no es una opción es la solución" />
        
        {!hideButton && (
          <div className="pt-2">
            <Button size="lg" onClick={() => openContactModal({ sourceContext: 'hero_home' })}>
              Empezar
              <ArrowRightIcon className="ms-2 size-4" data-icon="inline-end" />
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

export function LogosSection() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.section
      ref={ref}
      className="relative space-y-4 border-t pt-2 pb-0 md:pt-6 md:pb-10"
    >
      <motion.h2
        className="text-center text-lg font-medium tracking-tight text-slate-500 md:text-xl"
        initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
        animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.65, ease: EASE }}
      >
        Con la confianza de <span className="text-slate-900">expertos</span>
      </motion.h2>
      <motion.div
        className="relative z-10 mx-auto max-w-4xl"
        initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
        animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
        transition={{ duration: 0.75, ease: EASE, delay: 0.12 }}
      >
        <LogoCloud logos={logos} />
      </motion.div>
    </motion.section>
  );
}

const logos = [
  {
    src: 'https://media.egorealestate.com/ORIGINAL/abed00ed-61f1-454c-8e93-2cce127bf5c5.png',
    alt: 'Habitat Nou Logo',
  },
  {
    src: 'https://weworkwell.com/wp-content/uploads/2025/01/WE-WORK-WELL-1-e1738655996266.png',
    alt: 'WE WORK WELL Logo',
  },
  {
    src: 'https://i.pinimg.com/736x/98/1b/48/981b48d1e50189951a88c674276addc6.jpg',
    alt: 'REMAX Grupo Urbe Logo',
  },
  {
    src: 'https://sociocasa.com/images/logos/SocioCasa_N_Logo.webp',
    alt: 'Socio Casa Logo',
  },
  {
    src: 'https://www.grupotorresol.com/Portals//inmogrupotorresol/Images/logo.png',
    alt: 'Grupo TorreSol Logo',
  },
  {
    src: 'https://cibcn.es/wp-content/uploads/2022/07/logo-cideb-300x88-1.png',
    alt: 'Cideb Logo',
  },
  {
    src: 'https://inmoacierta.com/wp-content/uploads/2022/01/logoActInmo.svg',
    alt: 'Inmoacierta Logo',
  },
  {
    src: 'https://madrizcapital.com/wp-content/uploads/2025/03/Logo-Capital-verde-final-redondo.png',
    alt: 'Madriz Capital Logo',
  },
  {
    src: 'https://www.dssinmo.com/img/header/logo.png',
    alt: 'DSS Logo',
  },
];
