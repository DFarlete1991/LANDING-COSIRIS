import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Building2, ChevronLeft, ChevronRight, MapPinned, MessageCircle, ShieldCheck, X } from 'lucide-react';
import { AgencySearchBar, type SearchSuggestion } from '../../ui/AgencySearchBar';
import { AgencyCard } from '../../ui/AgencyCard';
import { PlaceholderImage } from '../../ui/PlaceholderImage';
import { getAllCitiesWithCounts, getNearbyCities } from '@/data/fixed-cities';
import { useInmobiliarias } from '@/context/InmobiliariasContext';
import { navigateTo } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

function Reveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

const WHY_COSIRIS = [
  { icon: ShieldCheck, title: 'Inmobiliarias verificadas', text: 'Todas las agencias del directorio son clientes activos de Cosiris, con datos de contacto reales.' },
  { icon: MapPinned, title: 'Conocimiento local', text: 'Encuentra la inmobiliaria con más presencia en la zona exacta donde buscas.' },
  { icon: MessageCircle, title: 'Contacto directo', text: 'Tu mensaje llega directamente a la inmobiliaria elegida, sin intermediarios.' },
  { icon: Building2, title: 'Sin coste para ti', text: 'Buscar y contactar inmobiliarias en el directorio es gratuito.' },
];

const STAT_ICONS = [Building2, MapPinned, ShieldCheck];

export function InmobiliariasHomeView({ onSearch }: { onSearch: (s: SearchSuggestion) => void }) {
  const { agencies, cityImages } = useInmobiliarias();
  const allCities = useMemo(() => getAllCitiesWithCounts(agencies), [agencies]);
  const totalYearsExperience = useMemo(() => agencies.reduce((sum, a) => sum + a.anos_experiencia, 0), [agencies]);
  const featured = agencies.slice(0, 6);
  const citiesWithPresence = allCities.filter((c) => c.count > 0).length;
  const featuredScrollRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ city: string; nearby: string[] } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(t);
  }, [toast]);

  const handleCityClick = (c: (typeof allCities)[number]) => {
    if (c.count === 0) {
      const nearby = getNearbyCities(c.city);
      setToast({ city: c.city, nearby });
      return;
    }
    onSearch({ label: `${c.city}, ${c.province}`, lat: c.lat, lng: c.lng });
  };

  const scrollFeatured = (direction: 'left' | 'right') => {
    const el = featuredScrollRef.current;
    if (!el) return;
    const firstCard = el.children[0] as HTMLElement | undefined;
    if (!firstCard) return;
    const gap = window.innerWidth >= 640 ? 16 : 12;
    const cardWidth = firstCard.offsetWidth + gap;
    el.scrollBy({ left: direction === 'right' ? cardWidth : -cardWidth, behavior: 'smooth' });
  };

  return (
    <div>
      {/* HERO — video de fondo real, con overlay oscuro + degradado para legibilidad.
          -mt-[72px]: el navbar de esta página es transparente y "sticky" (reserva su
          propio alto en el flujo normal); esto sube el hero para que el vídeo se vea
          detrás del navbar en vez de dejar un hueco blanco encima. */}
      <section className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden px-4 pb-20 pt-24 text-center text-white sm:min-h-[78vh] sm:pb-28 sm:pt-28">
        <div className="absolute inset-0">
          <video
            className="h-full w-full object-cover"
            src="/assets/inmobiliarias/hero-bg.mp4"
            poster="/assets/inmobiliarias/ciudades/madrid.jpg"
            autoPlay
            muted
            loop
            playsInline
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-br from-[#0F172A]/80 via-[#0F172A]/60 to-[#0F172A]/80" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#FF8000]/5 via-transparent to-transparent" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-2xl"
        >
          <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-[#FF8000] sm:text-[10px]">Directorio Cosiris</p>
          <h1 className="mt-3 text-2xl font-black leading-[1.1] tracking-[-0.03em] sm:text-3xl md:text-5xl">
            Encuentra la inmobiliaria ideal en tu zona
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-xs text-white/85 sm:mt-4 sm:text-sm md:text-base">
            Conectamos personas con inmobiliarias reales, cercanas y de confianza en toda España.
          </p>

          <div className="mt-8">
            <AgencySearchBar size="hero" onSelect={onSearch} placeholder="Ej. Madrid, Ruzafa Valencia..." />
          </div>

          {allCities.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 sm:mt-5 sm:gap-2">
              <span className="hidden text-xs text-white/50 sm:inline">Ciudades:</span>
              {allCities.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => handleCityClick(c)}
                  className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90 backdrop-blur-md transition-all duration-200 hover:border-[#FF8000] hover:bg-[#FF8000]/15 hover:text-white active:scale-95 sm:px-3 sm:text-xs"
                >
                  {c.city}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* STATS — cifras reales de nuestro directorio, sin inventar */}
      <div className="relative z-20 mx-auto -mt-10 max-w-4xl px-4 sm:-mt-14">
        <Reveal>
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-xl shadow-slate-900/10 sm:gap-5 sm:p-7 md:grid-cols-3">
            {[
              { value: agencies.length, label: 'Inmobiliarias asociadas', icon: STAT_ICONS[0] },
              { value: citiesWithPresence, label: 'Ciudades con presencia', icon: STAT_ICONS[1] },
              { value: `${totalYearsExperience}+`, label: 'Años de experiencia combinada', icon: STAT_ICONS[2] },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 transition-colors hover:bg-slate-100 sm:gap-4 sm:p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000] sm:h-12 sm:w-12">
                  <Icon size={18} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-[#0F172A] sm:text-3xl md:text-4xl">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 sm:text-xs">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      {/* CTA — tarjeta oscura sobre fondo blanco */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 pb-0 pt-8 sm:pb-0 sm:pt-14">
          <Reveal>
            <div className="flex flex-col items-center justify-between gap-5 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1a2340] px-5 py-7 text-center shadow-xl shadow-slate-900/20 sm:flex-row sm:px-8 sm:py-8 sm:text-left">
              <div>
                <p className="text-base font-bold text-white md:text-lg">¿Tienes una inmobiliaria y quieres aparecer aquí?</p>
                <p className="mt-1 text-sm text-white/60">Únete a las inmobiliarias que ya trabajan con Cosiris.</p>
              </div>
              <button
                type="button"
                onClick={() => navigateTo('/inmobiliarias/planes')}
                className="group shrink-0 rounded-full bg-[#FF8000] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF8000]/25 transition-all duration-200 hover:bg-[#E67300] hover:shadow-xl hover:shadow-[#FF8000]/30 active:scale-95"
              >
                Únete a Cosiris <ChevronRight size={14} className="ml-1 inline-block transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </Reveal>
        </div>
      </div>

      {/* FEATURED — fondo slate, carrusel con flechas */}
      <div className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <Reveal>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] sm:text-xl md:text-2xl">Inmobiliarias destacadas</h2>
            </div>
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => scrollFeatured('left')}
                className="absolute left-2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/15 transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:flex"
                aria-label="Anterior"
              >
                <ChevronLeft size={18} className="text-slate-700" />
              </button>
              <div
                ref={featuredScrollRef}
                className="flex gap-3 overflow-x-auto scroll-smooth [&::-webkit-scrollbar]:hidden sm:gap-4"
              >
                {featured.map((agency) => (
                  <div key={agency.id} className="w-64 shrink-0 sm:w-72">
                    <AgencyCard agency={agency} />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => scrollFeatured('right')}
                className="absolute right-2 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg shadow-slate-900/15 transition-all hover:scale-105 hover:shadow-xl active:scale-95 sm:flex"
                aria-label="Siguiente"
              >
                <ChevronRight size={18} className="text-slate-700" />
              </button>
            </div>
          </Reveal>
        </div>
      </div>

      {/* BUSCAR POR CIUDAD + EXPLORADOR — fondo blanco */}
      <div className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <Reveal delay={0.05}>
            <div className="mb-5 flex items-end justify-between">
              <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] sm:text-xl md:text-2xl">Busca por ciudad</h2>
              <button
                type="button"
                onClick={() => navigateTo('/inmobiliarias')}
                className="flex items-center gap-1 text-xs font-semibold text-[#FF8000] hover:underline shrink-0"
              >
                Ver todas <ChevronRight size={12} />
              </button>
            </div>
            <div className="relative">
              <AnimatePresence>
                {toast && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.96 }}
                    transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
                    className="absolute bottom-full left-0 right-0 z-30 mb-3 overflow-hidden rounded-xl border border-[#FF8000]/20 bg-[#0F172A] shadow-xl shadow-black/30"
                  >
                    <div className="flex items-start gap-3 p-4">
                      <div className="mt-0.5 shrink-0">
                        <MapPinned size={18} className="text-[#FF8000]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-white">No hay inmobiliarias en {toast.city} todavía</p>
                        <p className="mt-1 text-xs text-white/60">
                          Prueba en{' '}
                          {toast.nearby.map((name, i) => (
                            <span key={name}>
                              <button
                                type="button"
                                onClick={() => {
                                  const target = allCities.find((ac) => ac.city === name);
                                  if (target) onSearch({ label: `${target.city}, ${target.province}`, lat: target.lat, lng: target.lng });
                                }}
                                className="font-semibold text-[#FF8000] underline underline-offset-2 hover:text-orange-400"
                              >
                                {name}
                              </button>
                              {i < toast.nearby.length - 1 && <span className="text-white/40">{', '}</span>}
                            </span>
                          ))}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setToast(null)}
                        className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div
                className="group relative overflow-hidden"
                style={{
                  WebkitMaskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
                  maskImage: 'linear-gradient(to right, transparent, black 6%, black 94%, transparent)',
                }}
              >
                <div
                  className="animate-marquee flex w-max gap-3 py-2 sm:gap-4"
                  style={{ animationDuration: `${allCities.length * 7}s` }}
                >
                  {[...allCities, ...allCities].map((c, index) => (
                    <button
                      key={`${c.city}-${index}`}
                      type="button"
                      onClick={() => handleCityClick(c)}
                      className="group relative h-28 w-44 shrink-0 overflow-hidden rounded-xl shadow-md shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF8000]/10 sm:h-32 sm:w-52"
                    >
                      {cityImages[c.city] ? (
                        <img
                          src={cityImages[c.city]}
                          alt={c.city}
                          className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                          loading="lazy"
                        />
                      ) : (
                        <PlaceholderImage className="h-full w-full" label="Foto pendiente" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#FF8000]/0 via-transparent to-transparent transition-all duration-300 group-hover:from-[#FF8000]/20" />
                      <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
                        <p className="text-sm font-bold text-white drop-shadow-sm">{c.city}</p>
                        <p className="text-[11px] text-white/70">{c.count} {c.count === 1 ? 'inmobiliaria' : 'inmobiliarias'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* POR QUÉ COSIRIS — fondo slate */}
      <div className="bg-slate-50">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-12">
          <Reveal delay={0.05}>
            <div className="mb-8 text-center">
              <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] sm:text-xl md:text-2xl">¿Por qué este directorio?</h2>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {WHY_COSIRIS.map(({ icon: Icon, title, text }) => (
                <div key={title} className="group rounded-xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:border-[#FF8000]/20 hover:shadow-lg hover:shadow-[#FF8000]/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000] transition-all duration-300 group-hover:bg-[#FF8000] group-hover:text-white">
                    <Icon size={22} />
                  </div>
                  <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{text}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </div>
  );
}
