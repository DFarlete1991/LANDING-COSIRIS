import { motion } from 'framer-motion';
import { Search, Home, MapPin } from 'lucide-react';
import type { InmobiliariaPublica } from '@/data/inmobiliarias-mock';

const PING_DURATION = 3;

function FloatingParticle({ delay = 0, x, y }: { delay?: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute z-20 h-1.5 w-1.5 rounded-full bg-[#FF8000]/40"
      style={{ left: x, top: y }}
      animate={{ y: [0, -6, 0], opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2.5, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

function ConnectionDot({ delay = 0, x, y }: { delay?: number; x: string; y: string }) {
  return (
    <motion.div
      className="absolute z-20 h-2.5 w-2.5 rounded-full bg-[#FF8000] shadow-[0_0_8px_#FF8000]"
      style={{ left: x, top: y }}
      animate={{ scale: [1, 1.5, 1] }}
      transition={{ duration: PING_DURATION, repeat: Infinity, delay, ease: 'easeInOut' }}
    />
  );
}

interface LogoCardProps {
  agency: InmobiliariaPublica;
  x: string;
  y: string;
  rotate?: number;
  delay?: number;
}

function LogoCard({ agency, x, y, rotate = 0, delay = 0 }: LogoCardProps) {
  return (
    <motion.div
      className="absolute z-10 flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)] backdrop-blur-xl"
      style={{ left: x, top: y, transform: `rotate(${rotate}deg)` }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: [0, -3, 0] }}
      transition={{ duration: 4 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <div
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white overflow-hidden"
        style={{ backgroundColor: agency.logo_url ? 'transparent' : (agency.color_hex ?? '#FF8000') }}
      >
        {agency.logo_url ? (
          <img src={agency.logo_url} alt="" className="h-full w-full object-contain" />
        ) : (
          agency.nombre_comercial.split(' ').map((w) => w[0]).slice(0, 2).join('')
        )}
      </div>
      <span className="max-w-[72px] truncate text-[11px] font-semibold text-slate-700 leading-tight">
        {agency.nombre_comercial}
      </span>
    </motion.div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
  x: string;
  y: string;
  delay?: number;
}

function StatCard({ value, label, x, y, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      className="absolute z-10 rounded-xl border border-slate-100 bg-white px-3 py-2.5 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: [0, -2, 0] }}
      transition={{ duration: 5 + delay, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <p className="text-sm font-black text-[#0F172A] leading-none">{value}</p>
      <p className="mt-0.5 text-[9px] font-medium text-slate-400 whitespace-nowrap">{label}</p>
    </motion.div>
  );
}

export function AgencyNetworkIllustration({ agencies }: { agencies: InmobiliariaPublica[] }) {
  const cards = agencies.slice(0, 10);
  const extraColors = ['#7C3AED', '#0891B2', '#059669', '#D97706'];

  const positions = [
    { x: '3%', y: '22%', rotate: -4 },
    { x: '16%', y: '6%', rotate: 2 },
    { x: '36%', y: '2%', rotate: -2 },
    { x: '56%', y: '3%', rotate: 3 },
    { x: '74%', y: '8%', rotate: -1 },
    { x: '87%', y: '20%', rotate: 2 },
    { x: '90%', y: '42%', rotate: -3 },
    { x: '85%', y: '62%', rotate: 1 },
    { x: '70%', y: '78%', rotate: -2 },
    { x: '50%', y: '84%', rotate: 3 },
    { x: '30%', y: '82%', rotate: -1 },
    { x: '14%', y: '72%', rotate: 2 },
  ];

  const stats = [
    { value: '+650', label: 'Agencias', x: '78%', y: '58%' },
    { value: '+30.000', label: 'Propiedades', x: '38%', y: '84%' },
    { value: '98%', label: 'Satisfacción', x: '5%', y: '48%' },
    { value: 'Toda España', label: 'Cobertura nacional', x: '8%', y: '72%' },
  ];

  const nodes = [
    { x: '10%', y: '14%', delay: 0 },
    { x: '26%', y: '4%', delay: 0.5 },
    { x: '46%', y: '1%', delay: 1 },
    { x: '65%', y: '4%', delay: 0.3 },
    { x: '81%', y: '12%', delay: 0.8 },
    { x: '92%', y: '30%', delay: 0.2 },
    { x: '93%', y: '52%', delay: 0.6 },
    { x: '45%', y: '90%', delay: 0.4 },
    { x: '24%', y: '88%', delay: 0.7 },
    { x: '5%', y: '60%', delay: 0.9 },
  ];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-br from-white via-orange-50/20 to-white" style={{ aspectRatio: '16/9' }}>
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-16 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#FF8000]/8 blur-[100px]" />
        <div className="absolute -bottom-20 left-1/4 h-56 w-56 rounded-full bg-[#FF8000]/5 blur-[80px]" />
        <div className="absolute -right-10 top-1/3 h-48 w-48 rounded-full bg-[#FF8000]/6 blur-[90px]" />
      </div>

      <svg className="absolute inset-0 z-10 h-full w-full" viewBox="0 0 1000 562.5" preserveAspectRatio="none">
        <defs>
          <linearGradient id="lineGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FF8000" stopOpacity="0" />
            <stop offset="30%" stopColor="#FF8000" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#FF8000" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FF8000" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="lineGrad2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FF8000" stopOpacity="0.15" />
            <stop offset="50%" stopColor="#FF8000" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF8000" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        <path d="M30 120 C 100 30, 200 10, 300 15" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M300 15 C 400 20, 600 15, 700 35" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M700 35 C 800 55, 880 85, 900 110" fill="none" stroke="url(#lineGrad1)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M900 110 C 920 150, 930 200, 920 235" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M920 235 C 910 300, 870 370, 820 400" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M820 400 C 760 430, 680 450, 600 463" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M600 463 C 500 475, 400 480, 300 470" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M300 470 C 200 460, 100 430, 60 400" fill="none" stroke="url(#lineGrad2)" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M60 400 C 40 370, 25 320, 30 280" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" />
        <path d="M30 280 C 35 240, 30 180, 30 120" fill="none" stroke="url(#lineGrad1)" strokeWidth="1" strokeLinecap="round" strokeDasharray="4 6" />

        <path d="M400 15 C 430 60, 440 100, 450 130" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="M530 15 C 560 60, 570 100, 560 130" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="M700 35 C 680 80, 650 120, 610 140" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="M30 120 C 80 180, 150 230, 220 260" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="M30 280 C 100 300, 180 310, 240 300" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />
        <path d="M920 235 C 860 250, 800 260, 730 250" fill="none" stroke="url(#lineGrad2)" strokeWidth="1" strokeLinecap="round" strokeDasharray="3 5" />

        {[75, 175, 275, 375, 475, 575, 672, 772, 872, 350, 450, 550, 650].map((x) => (
          <circle key={x} cx={x} cy={385} r={2} fill="#FF8000" opacity={0.15} />
        ))}
        {[80, 180, 280, 380, 480, 580, 680, 780].map((x) => (
          <circle key={x + 100} cx={x} cy={430} r={1.5} fill="#FF8000" opacity={0.2} />
        ))}
      </svg>

      <FloatingParticle x="12%" y="8%" delay={0} />
      <FloatingParticle x="48%" y="6%" delay={0.8} />
      <FloatingParticle x="82%" y="4%" delay={0.4} />
      <FloatingParticle x="95%" y="35%" delay={1.2} />
      <FloatingParticle x="55%" y="92%" delay={0.6} />
      <FloatingParticle x="8%" y="55%" delay={1.5} />
      <FloatingParticle x="92%" y="70%" delay={0.3} />
      <FloatingParticle x="20%" y="90%" delay={0.9} />

      {nodes.map((n, i) => (
        <ConnectionDot key={i} x={n.x} y={n.y} delay={n.delay} />
      ))}

      {stats.map((s, i) => (
        <StatCard key={s.label} value={s.value} label={s.label} x={s.x} y={s.y} delay={i * 0.3} />
      ))}

      {cards.map((agency, i) => (
        <LogoCard
          key={agency.id}
          agency={agency}
          x={positions[i].x}
          y={positions[i].y}
          rotate={positions[i].rotate}
          delay={i * 0.4}
        />
      ))}

      {cards.length < 12 && extraColors.slice(0, 12 - cards.length).map((color, i) => {
        const idx = cards.length + i;
        return (
          <motion.div
            key={`extra-${i}`}
            className="absolute z-10 flex items-center gap-2.5 rounded-xl border border-white/60 bg-white/80 px-3 py-2 shadow-[0_4px_20px_-6px_rgba(0,0,0,0.12)] backdrop-blur-xl"
            style={{ left: positions[idx].x, top: positions[idx].y, transform: `rotate(${positions[idx].rotate}deg)` }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: [0, -3, 0] }}
            transition={{ duration: 4 + idx * 0.4, repeat: Infinity, delay: idx * 0.4, ease: 'easeInOut' }}
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[9px] font-bold text-white"
              style={{ backgroundColor: color }}
            >
              {String.fromCharCode(65 + i)}
            </div>
            <span className="max-w-[72px] truncate text-[11px] font-semibold text-slate-700 leading-tight">
              Inmobiliaria {String.fromCharCode(65 + i)}
            </span>
          </motion.div>
        );
      })}

      <motion.div
        className="absolute z-20"
        style={{ left: '50%', top: '48%', transform: 'translate(-50%, -50%) rotate(-12deg)', width: '48%' }}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: [0, -2, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_12px_40px_-12px_rgba(0,0,0,0.2)]">
          <div className="flex items-center gap-1.5 border-b border-slate-100 bg-slate-50/60 px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-red-400" />
            <div className="h-2 w-2 rounded-full bg-amber-400" />
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <div className="ml-2 h-2 flex-1 rounded bg-slate-200/60" style={{ maxWidth: 100 }} />
          </div>
          <div className="p-3">
            <div className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1.5">
              <Search size={11} className="text-slate-400" />
              <span className="text-[9px] text-slate-400">Buscar agencias, propiedades...</span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded bg-[#FF8000]/10 text-[6px] font-bold text-[#FF8000]">
                    <Home size={8} />
                  </div>
                  <span className="text-[8px] font-semibold text-slate-800">Inmoacierta</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[7px] text-slate-400">
                  <MapPin size={6} /> Madrid
                </div>
                <div className="mt-1 rounded bg-[#FF8000]/8 px-1 py-0.5 text-[7px] font-bold text-[#FF8000]">
                  184 propiedades
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded bg-[#FF8000]/10 text-[6px] font-bold text-[#FF8000]">
                    <Home size={8} />
                  </div>
                  <span className="text-[8px] font-semibold text-slate-800">Chamberí</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[7px] text-slate-400">
                  <MapPin size={6} /> Madrid
                </div>
                <div className="mt-1 rounded bg-[#FF8000]/8 px-1 py-0.5 text-[7px] font-bold text-[#FF8000]">
                  72 propiedades
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded bg-[#1E3A5F]/10 text-[6px] font-bold text-[#1E3A5F]">
                    <Home size={8} />
                  </div>
                  <span className="text-[8px] font-semibold text-slate-800">MB Gestors</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[7px] text-slate-400">
                  <MapPin size={6} /> Barcelona
                </div>
                <div className="mt-1 rounded bg-[#1E3A5F]/8 px-1 py-0.5 text-[7px] font-bold text-[#1E3A5F]">
                  156 propiedades
                </div>
              </div>
              <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-4 w-4 items-center justify-center rounded bg-emerald-500/10 text-[6px] font-bold text-emerald-600">
                    <Home size={8} />
                  </div>
                  <span className="text-[8px] font-semibold text-slate-800">Gràcia</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[7px] text-slate-400">
                  <MapPin size={6} /> Barcelona
                </div>
                <div className="mt-1 rounded bg-emerald-500/8 px-1 py-0.5 text-[7px] font-bold text-emerald-600">
                  43 propiedades
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto -mt-px h-1.5 w-[108%] rounded-b-lg bg-slate-100" />
      </motion.div>
    </div>
  );
}
