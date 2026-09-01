import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type HeroTitleProps = {
  className?: string;
  drawUnderline?: boolean;
};

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroTitle({ className, drawUnderline = false }: HeroTitleProps) {
  return (
    <h1
      className={cn(
        'text-balance text-center text-4xl tracking-tight md:text-5xl lg:text-5xl',
        className,
      )}
    >
      Estamos a un clic de distancia de
      <br />
      <span className="relative inline-flex text-primary">
        <span>tu cliente ideal</span>
        <svg
          className="pointer-events-none absolute -bottom-1 left-0 h-3 w-full"
          viewBox="0 0 320 14"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <motion.path
            d="M4 10.5C70 3 150 3 316 10.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={drawUnderline ? { pathLength: 1 } : { pathLength: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease: EASE }}
          />
        </svg>
      </span>
      <br />
      {/* <span className="text-3xl md:text-4xl">Construye un sistema y no dependas exclusivamente de referidos.</span> */}
    </h1>
  );
}
