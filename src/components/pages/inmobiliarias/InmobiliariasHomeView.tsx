import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Building2, ChevronRight, MapPinned, MessageCircle, ShieldCheck } from 'lucide-react';
import { AgencySearchBar, type SearchSuggestion } from '../../ui/AgencySearchBar';
import { AgencyCard } from '../../ui/AgencyCard';
import { AgencyMap } from '../../ui/AgencyMap';
import { PlaceholderImage } from '../../ui/PlaceholderImage';
import { buildCityIndex } from '@/data/city-index';
import { CITY_IMAGES } from '@/data/city-images';
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
  const { agencies } = useInmobiliarias();
  const cityIndex = useMemo(() => buildCityIndex(agencies), [agencies]);
  const totalYearsExperience = useMemo(() => agencies.reduce((sum, a) => sum + a.anos_experiencia, 0), [agencies]);
  const featured = agencies.slice(0, 6);
  const popularCities = cityIndex.slice(0, 6);
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div>
      {/* HERO — video de fondo real, con overlay oscuro + degradado para legibilidad */}
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center overflow-hidden px-4 pb-28 pt-20 text-center text-white">
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
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#FF8000]">Directorio Cosiris</p>
          <h1 className="mt-3 text-3xl font-black leading-[1.1] tracking-[-0.03em] md:text-5xl">
            Encuentra la inmobiliaria ideal en tu zona
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-white/70 md:text-base">
            Conectamos personas con inmobiliarias reales, cercanas y de confianza en toda España.
          </p>

          <div className="mt-8">
            <AgencySearchBar size="hero" onSelect={onSearch} placeholder="Ej. Madrid, Ruzafa Valencia..." />
          </div>

          {popularCities.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
              <span className="text-xs text-white/50">Ciudades populares:</span>
              {popularCities.map((c) => (
                <button
                  key={c.city}
                  type="button"
                  onClick={() => onSearch({ label: `${c.city}, ${c.province}`, lat: c.lat, lng: c.lng })}
                  className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#FF8000] hover:bg-[#FF8000]/10 hover:text-white active:scale-95"
                >
                  {c.city}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </section>

      {/* STATS — cifras reales de nuestro directorio, sin inventar */}
      <div className="relative z-20 mx-auto -mt-14 max-w-4xl px-4">
        <Reveal>
          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/10 md:grid-cols-3">
            {[
              { value: agencies.length, label: 'Inmobiliarias asociadas', icon: STAT_ICONS[0] },
              { value: cityIndex.length, label: 'Ciudades con presencia', icon: STAT_ICONS[1] },
              { value: `${totalYearsExperience}+`, label: 'Años de experiencia combinada', icon: STAT_ICONS[2] },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label} className="flex items-center gap-4 rounded-xl bg-slate-50 p-4 transition-colors hover:bg-slate-100">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000]">
                  <Icon size={22} />
                </div>
                <div className="text-left">
                  <p className="text-2xl font-black text-[#0F172A] md:text-3xl">{value}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16">
        {/* FEATURED */}
        <Reveal>
          <div className="mb-5 flex items-end justify-between">
            <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] md:text-xl">Inmobiliarias destacadas</h2>
          </div>
          <div className="relative">
            <div ref={scrollRef} className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3">
              {featured.map((agency) => (
                <div key={agency.id} className="w-72 shrink-0 snap-start">
                  <AgencyCard agency={agency} />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-white to-transparent" />
          </div>
        </Reveal>

        {/* BUSCAR POR CIUDAD */}
        <Reveal delay={0.05}>
          <div className="mb-5 mt-16">
            <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] md:text-xl">Busca por ciudad</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {cityIndex.map((c) => (
              <button
                key={c.city}
                type="button"
                onClick={() => onSearch({ label: `${c.city}, ${c.province}`, lat: c.lat, lng: c.lng })}
                className="group relative h-32 overflow-hidden rounded-xl shadow-md shadow-slate-900/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#FF8000]/10"
              >
                {CITY_IMAGES[c.city] ? (
                  <img
                    src={CITY_IMAGES[c.city]}
                    alt={c.city}
                    className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-110"
                    loading="lazy"
                  />
                ) : (
                  <PlaceholderImage className="h-full w-full" label="Foto pendiente" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#FF8000]/0 via-transparent to-transparent transition-all duration-300 group-hover:from-[#FF8000]/20" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-left">
                  <p className="text-sm font-bold text-white drop-shadow-sm">{c.city}</p>
                  <p className="text-[11px] text-white/70">{c.count} {c.count === 1 ? 'inmobiliaria' : 'inmobiliarias'}</p>
                </div>
              </button>
            ))}
          </div>
        </Reveal>

        {/* MAPA */}
        <Reveal delay={0.05}>
          <div className="mb-5 mt-16">
            <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] md:text-xl">Explora en el mapa</h2>
            <p className="mt-1 text-sm text-slate-500">Todas las inmobiliarias asociadas a Cosiris, de un vistazo.</p>
          </div>
          <div className="h-[420px] overflow-hidden rounded-xl shadow-lg shadow-slate-900/5">
            <AgencyMap
              agencies={agencies}
              nearestId={null}
              searchPoint={null}
              center={[40.2, -3.0]}
              zoom={5}
              onSelect={(id) => {
                const agency = agencies.find((a) => a.id === id);
                if (agency) navigateTo(`/inmobiliarias/${agency.id}`);
              }}
            />
          </div>
        </Reveal>

        {/* POR QUÉ COSIRIS */}
        <Reveal delay={0.05}>
          <div className="mb-6 mt-16 text-center">
            <h2 className="text-lg font-black tracking-[-0.01em] text-[#0F172A] md:text-xl">¿Por qué este directorio?</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {WHY_COSIRIS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group rounded-xl border border-slate-100 bg-white p-5 shadow-sm shadow-slate-900/5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#FF8000]/20 hover:shadow-md hover:shadow-[#FF8000]/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF8000]/10 text-[#FF8000] transition-all duration-300 group-hover:bg-[#FF8000] group-hover:text-white">
                  <Icon size={20} />
                </div>
                <p className="mt-4 text-sm font-bold text-slate-900">{title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{text}</p>
              </div>
            ))}
          </div>
        </Reveal>

        {/* CTA FINAL */}
        <Reveal delay={0.05}>
          <div className="mt-16 flex flex-col items-center justify-between gap-6 rounded-2xl bg-gradient-to-br from-[#0F172A] to-[#1a2340] px-8 py-10 text-center shadow-xl shadow-slate-900/20 md:flex-row md:text-left">
            <div>
              <p className="text-base font-bold text-white md:text-lg">¿Tienes una inmobiliaria y quieres aparecer aquí?</p>
              <p className="mt-1.5 text-sm text-white/60">Únete a las inmobiliarias que ya trabajan con Cosiris.</p>
            </div>
            <button
              type="button"
              onClick={() => navigateTo('/captacion_inmobiliarias')}
              className="group shrink-0 rounded-full bg-[#FF8000] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#FF8000]/25 transition-all duration-200 hover:bg-[#E67300] hover:shadow-xl hover:shadow-[#FF8000]/30 active:scale-95"
            >
              Únete a Cosiris <ChevronRight size={14} className="ml-1 inline-block transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
