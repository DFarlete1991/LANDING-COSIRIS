import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, Check, MessageCircle, Play, Plus } from 'lucide-react';
import { useUI } from '@/context/UIContext';
import { navigateTo } from '@/lib/utils';
import { FAQS } from '@/data/faqs';
import { TeamVideo } from '@/components/ui/team-video';
import { TEAM_PILLARS } from '@/data/team-pillars';
import { VideoGrid } from '@/components/ui/video-grid';

// Secciones de la home, en estilo editorial. Siguen el guion de contenido de
// Cosiris: qué servicios hay, quién lo cuenta, quiénes somos y dudas. La evolución
// del sector y el proceso viven en sus propios archivos.
// Las secciones se separan con cambios suaves de color de fondo. Las medidas van
// en rem: en pantallas grandes la home escala entera (ver .home-fluid).
// Sobre blanco, el naranja de marca (#FF8000) no llega al contraste mínimo en
// texto pequeño (2,5:1): etiquetas usan #C2410C y titulares #E67300.

const EXPO: [number, number, number, number] = [0.19, 1, 0.22, 1];
const SNAPPY = 'ease-[cubic-bezier(0.23,1,0.32,1)]';
const WRAP = 'mx-auto w-full max-w-[87.5rem] px-5 md:px-10';
const H2 = 'text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] md:text-5xl 2xl:text-6xl';
const LEAD = 'text-base leading-relaxed text-neutral-600 md:text-lg';
const EYEBROW = 'text-sm font-bold text-[#C2410C]';
const YOUTUBE_URL = 'https://www.youtube.com/@cosiris_inv';

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, ease: EXPO, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function go(href: string) {
  return (e: React.MouseEvent) => {
    e.preventDefault();
    navigateTo(href);
  };
}

// Enlace con forma de botón a otra parte de la web. dark: sobre fondo negro.
function LinkButton({ href, children, dark = false }: { href: string; children: React.ReactNode; dark?: boolean }) {
  const external = href.startsWith('http');
  const inPage = href.startsWith('#');
  const Icon = external ? ArrowUpRight : ArrowRight;
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : inPage ? {} : { onClick: go(href) })}
      className={`group inline-flex min-h-12 items-center gap-2 rounded-full border px-5 text-sm font-bold transition-[background-color,border-color,color,transform] duration-150 ${SNAPPY} active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300] focus-visible:ring-offset-2 ${
        dark ? 'border-white/30 text-white hover:border-white hover:bg-white hover:text-black' : 'border-neutral-300 text-black hover:border-black hover:bg-black hover:text-white'
      }`}
    >
      {children}
      <Icon size={16} className={`transition-transform duration-200 ${SNAPPY} group-hover:translate-x-0.5`} aria-hidden="true" />
    </a>
  );
}

/* ── 4. Un solo equipo: vídeo en la propia página y cuatro servicios ───── */

const HOW_TO_VIDEO = 'yRyfCQtk3wo';

const SERVICES = [
  { image: '/assets/home/megafono.webp', title: 'Captación Ads + IA', text: 'Campañas en Meta para llegar a propietarios de tu zona que quieren vender. Un agente de IA les llama para saber si de verdad van en serio.', href: '/servicios#ads', tint: 'bg-[#FEEEE1]' },
  { image: '/assets/home/movil.webp', title: 'Redes sociales', text: 'Diseño, textos, planificación y vídeos para que tus redes trabajen por ti.', href: '/servicios#redes', tint: 'bg-[#F6F3F4]' },
  { image: '/assets/home/email.webp', title: 'Email marketing', text: 'Seguimiento automático de tus leads para no perder oportunidades.', href: '/servicios#email', tint: 'bg-[#F6F3F4]' },
  { image: '/assets/home/robot.webp', title: 'Automatizaciones IA y CRM', text: 'Todos tus contactos ordenados en un CRM, con avisos y tareas para que tu equipo sepa a quién llamar y cuándo.', href: '/servicios#crm', tint: 'bg-[#FEEEE1]' },
];

// El reproductor solo se carga al pulsar play y se queda en la propia página;
// volumen, progreso y pantalla completa son los controles nativos de YouTube.
function InlineVideo({ playing, onPlay }: { playing: boolean; onPlay: () => void }) {
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-[18px] bg-black shadow-[0_16px_40px_rgba(0,0,0,0.14)]">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${HOW_TO_VIDEO}?autoplay=1&rel=0`}
          title="¿Tus anuncios captan pisos o solo leads?"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={onPlay}
          aria-label="Reproducir el vídeo: ¿Tus anuncios captan pisos o solo leads?"
          className="group absolute inset-0 cursor-pointer focus-visible:outline-none"
        >
          {/* En móvil y tablet basta la portada de 640 px (~40 kB); la de 1280 px
              (~130 kB) solo en escritorio, donde el vídeo se ve grande. */}
          <picture>
            <source media="(min-width: 1024px)" srcSet={`https://img.youtube.com/vi/${HOW_TO_VIDEO}/maxresdefault.jpg`} />
            <img
              src={`https://img.youtube.com/vi/${HOW_TO_VIDEO}/sddefault.jpg`}
              alt=""
              loading="lazy"
              decoding="async"
              width={1280}
              height={720}
              className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${SNAPPY} [@media(hover:hover)]:group-hover:scale-[1.02]`}
            />
          </picture>
          {/* Abajo a la derecha: la portada lleva el título en grande y no hay que taparlo. */}
          <span className={`absolute right-4 bottom-4 flex size-16 items-center justify-center rounded-full bg-[#FF8000] text-white shadow-md transition-transform duration-200 ${SNAPPY} group-hover:scale-105 group-focus-visible:ring-2 group-focus-visible:ring-white md:size-20`}>
            <Play size={26} fill="currentColor" strokeWidth={0} className="ml-1" />
          </span>
        </button>
      )}
    </div>
  );
}

export function ServicesSection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="w-full bg-[#FFF8F1] py-12 md:py-28">
      <div className={WRAP}>
        <div className="grid grid-cols-1 items-center gap-6 md:gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-14">
          <Reveal>
            <span aria-hidden="true" className="mb-5 block h-1 w-14 rounded-full bg-[#FF8000]" />
            <h2 className="text-3xl font-extrabold leading-[1.08] tracking-[-0.03em] text-[#111111] md:text-5xl 2xl:text-6xl">
              Un solo <span className="text-[#E67300]">equipo.</span>
              <span className="block">Toda tu captación.</span>
            </h2>
            <p className="mt-5 max-w-[31.25rem] text-base leading-relaxed text-neutral-700 md:text-lg">
              Todo lo digital de tu inmobiliaria con un único proveedor, especializado en el sector. En este vídeo te explicamos por qué unos anuncios captan pisos y otros solo leads.
            </p>
            <div className="mt-5 flex flex-wrap gap-3 md:mt-7">
              <button
                type="button"
                onClick={() => setPlaying(true)}
                className={`inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-lg bg-[#FF8000] px-7 text-sm font-bold text-white transition-[background-color,transform] duration-150 ${SNAPPY} hover:bg-[#E67300] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2`}
              >
                <Play size={15} fill="currentColor" strokeWidth={0} aria-hidden="true" />
                Ver el vídeo
              </button>
              <LinkButton href="#servicios">Quiero conocer más sobre vuestros servicios</LinkButton>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <InlineVideo playing={playing} onPlay={() => setPlaying(true)} />
          </Reveal>
        </div>

        <div id="servicios" className="mt-10 max-w-3xl scroll-mt-28 md:mt-20">
          <Reveal>
            <p className={EYEBROW}>Nuestros servicios</p>
            <h2 className={`mt-3 ${H2}`}>
              Todo lo digital de tu inmobiliaria, <span className="text-[#E67300]">en un solo sitio.</span>
            </h2>
          </Reveal>
        </div>

        <ul className="mt-5 grid grid-cols-2 gap-3 md:mt-7 md:gap-4 xl:grid-cols-4">
          {SERVICES.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, ease: EXPO, delay: i * 0.06 }}
              className="h-full"
            >
              {/* La tarjeta va en un div propio: framer escribe el transform del li y
                  anularía el desplazamiento al pasar el ratón. */}
              <div className={`flex h-full flex-col gap-2 rounded-2xl border border-neutral-200/70 bg-white p-3 shadow-[0_4px_16px_rgba(0,0,0,0.05)] md:flex-row md:items-center md:gap-4 md:p-4 transition-transform duration-200 ${SNAPPY} md:[@media(hover:hover)]:hover:-translate-y-1`}>
                <span className={`flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full md:size-24 2xl:size-28 ${s.tint}`}>
                  <img src={s.image} alt="" loading="lazy" decoding="async" width={222} height={195} className="w-full" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col self-stretch">
                  <span className="hidden size-7 items-center justify-center rounded-full bg-[#FFF0E5] text-xs md:inline-flex font-bold tabular-nums text-[#C2410C]">0{i + 1}</span>
                  <h3 className="flex-1 text-sm font-extrabold leading-snug md:mt-2 md:flex-none md:text-base tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-1 hidden flex-1 text-[13px] leading-relaxed text-neutral-600 md:block">{s.text}</p>
                  <a href={s.href} onClick={go(s.href)} className="group/link inline-flex min-h-11 w-fit items-center gap-1.5 text-[13px] font-bold text-[#C2410C] underline underline-offset-4 hover:text-[#9A3412] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E67300]">
                    Ver servicio
                    <ArrowRight size={14} className={`transition-transform duration-200 ${SNAPPY} group-hover/link:translate-x-0.5`} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>

        <Reveal className="mt-5 flex flex-wrap gap-3 md:mt-8">
          <LinkButton href="/servicios">Todos los servicios</LinkButton>
          <LinkButton href="/calculadora-roi">Ver planes</LinkButton>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 5. Testimonios en vídeo y quién confía en nosotros ───────────────── */

export function ClientsSection() {
  return (
    <section id="testimonios" className="w-full scroll-mt-16 bg-white">
      {/* El mismo muro de vídeos que en /servicios. */}
      <VideoGrid agencyMedia />
      <div className={`${WRAP} pt-8 pb-12 md:pb-20`}>
        <div className="flex flex-wrap gap-3">
          <LinkButton href="/inmobiliarias">Inmobiliarias en tu zona</LinkButton>
          <span className="hidden md:contents">
            <LinkButton href={YOUTUBE_URL}>Más vídeos en YouTube</LinkButton>
            <LinkButton href="/inmobiliarias/registro">Hazte partner</LinkButton>
          </span>
        </div>
      </div>
    </section>
  );
}

/* ── 6. Quiénes somos: el equipo y sus años en el sector ───────────────── */

export function AboutSection() {
  return (
    <section className="w-full bg-white py-12 md:py-28">
      <div className={`${WRAP} grid grid-cols-1 items-center gap-6 md:gap-12 lg:grid-cols-[auto_minmax(0,1fr)] lg:gap-20`}>
        <Reveal className="order-2 mx-auto w-full max-w-[15rem] md:max-w-[20rem] lg:order-1 lg:w-[20rem]">
          <TeamVideo />
        </Reveal>
        <Reveal delay={0.06} className="order-1 lg:order-2">
          <p className={EYEBROW}>Quiénes somos</p>
          <h2 className={`mt-3 ${H2}`}>
            Un equipo que conoce <span className="text-[#E67300]">tu día a día.</span>
          </h2>
          <p className={`mt-4 max-w-2xl ${LEAD}`}>
            Nuestro equipo lleva más de 11 años visitando inmobiliarias. Sabemos lo que es perseguir a un propietario que no contesta o perder una exclusiva por llegar tarde. Por eso trabajamos al lado de tu equipo, no por libre.
          </p>
          {/* El contenido de /nosotros, aquí mismo: sin enviar a otra página. */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:mt-10 md:grid-cols-3 md:gap-8">
            {TEAM_PILLARS.map((p) => (
              <div key={p.title} className="border-t-2 border-[#FF8000] pt-4">
                <p.icon size={22} aria-hidden="true" className="text-[#E67300]" />
                <h3 className="mt-2 text-lg font-extrabold tracking-tight">{p.title}</h3>
                {p.subtitle && <p className="mt-0.5 text-[13px] font-semibold leading-snug text-neutral-600">{p.subtitle}</p>}
                <ul className="mt-3 space-y-1.5">
                  {p.checks.map((c) => (
                    <li key={c} className="flex items-start gap-2 text-sm leading-snug text-neutral-700">
                      <Check size={15} strokeWidth={3} aria-hidden="true" className="mt-0.5 shrink-0 text-[#E67300]" />
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ── 7. Dudas: preguntas frecuentes y herramientas ─────────────────────── */

const TOOLS = [
  { title: 'Calculadora ROI', text: 'Calcula tu plan de captación', href: '/calculadora-roi' },
  { title: 'Inmobiliarias en tu zona', text: 'Abre el directorio', href: '/inmobiliarias' },
  { title: 'Nuestro podcast', text: 'Entrevistas y estrategia del sector', href: YOUTUBE_URL, external: true },
];

export function FaqSection() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="w-full bg-[#FFF8F1] py-12 md:py-28">
      <div className={`${WRAP} grid grid-cols-1 gap-5 md:gap-12 lg:grid-cols-[1fr_1.3fr] lg:gap-24`}>
        <div>
          <Reveal>
            <h2 className={H2}>
              ¿Tienes <span className="text-[#E67300]">dudas</span>?
            </h2>
          </Reveal>
          <ul className="mt-10 hidden border-b border-neutral-200 lg:block">
            {TOOLS.map((t) => {
              const Icon = t.external ? ArrowUpRight : ArrowRight;
              return (
                <li key={t.title} className="border-t border-neutral-200">
                  <a
                    href={t.href}
                    {...(t.external ? { target: '_blank', rel: 'noopener noreferrer' } : { onClick: go(t.href) })}
                    className="group flex min-h-16 items-center justify-between gap-5 py-2.5 focus-visible:underline focus-visible:outline-none"
                  >
                    <span>
                      <span className="block text-base font-bold tracking-tight md:text-lg">{t.title}</span>
                      <span className="block text-sm text-neutral-600">{t.text}</span>
                    </span>
                    <Icon size={22} className={`shrink-0 transition-transform duration-200 ${SNAPPY} group-hover:translate-x-1`} aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <ul className="border-b border-neutral-200">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <li key={f.q} className="border-t border-neutral-200">
                <h3>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : i)}
                    aria-expanded={isOpen}
                    className="flex min-h-16 w-full cursor-pointer items-center justify-between gap-6 py-3 text-left text-base font-bold tracking-tight focus-visible:underline focus-visible:outline-none md:text-lg"
                  >
                    {f.q}
                    <Plus size={22} aria-hidden="true" className={`shrink-0 text-[#E67300] transition-transform duration-200 ${SNAPPY} ${isOpen ? 'rotate-45' : ''}`} />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: EXPO }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-base leading-relaxed text-neutral-600">{f.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

/* ── Botón flotante de dudas ───────────────────────────────────────────── */

// Aparece cuando el visitante ya ha bajado del hero (allí ya tiene el botón
// principal) y se esconde mientras el formulario de contacto está abierto y al
// llegar al final, donde ya están el bloque de la calculadora y el pie.
export function FloatingHelpButton() {
  const { openContactModal, isContactModalOpen } = useUI();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const nearEnd = y + window.innerHeight > document.documentElement.scrollHeight - window.innerHeight * 1.2;
      setVisible(y > window.innerHeight * 0.6 && !nearEnd);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shown = visible && !isContactModalOpen;

  return (
    <button
      type="button"
      onClick={() => openContactModal({ sourceContext: 'home_floating_help' })}
      aria-hidden={!shown}
      aria-label="¿Dudas? Escríbenos"
      tabIndex={shown ? 0 : -1}
      className={`fixed right-4 bottom-4 z-40 inline-flex size-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-black text-sm font-bold text-white shadow-lg shadow-black/25 ring-1 ring-white/15 transition-[opacity,transform,background-color] duration-200 ${SNAPPY} hover:bg-neutral-800 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8000] md:right-6 md:bottom-6 lg:size-auto lg:min-h-12 lg:py-3 lg:pr-5 lg:pl-4 ${
        shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <MessageCircle size={20} className="text-[#FF8000]" />
      <span className="hidden lg:inline">¿Dudas? Escríbenos</span>
    </button>
  );
}
