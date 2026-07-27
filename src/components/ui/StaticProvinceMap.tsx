import { useEffect, useRef, useState } from 'react';
import type { ProvinceIndexEntry } from '@/data/province-index';
import { staticMapUrl, gmapsAvailable } from '@/lib/map-static';

function markerSize(count: number): 'tiny' | 'mid' | 'small' | undefined {
  if (count <= 2) return 'tiny';
  if (count <= 5) return 'small';
  return 'mid';
}

export function StaticProvinceMap({ provinces }: { provinces: ProvinceIndexEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 640, h: 160 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = Math.round(entry.contentRect.width);
        const h = Math.round(entry.contentRect.height);
        if (w > 0 && h > 0) setSize({ w, h });
      }
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!gmapsAvailable() || provinces.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-xl border border-[#E6E8EC] bg-slate-100 text-xs text-slate-400">
        Mapa no disponible
      </div>
    );
  }

  const src = staticMapUrl(
    { lat: 40.2, lng: -3.5 },
    5,
    size.w,
    size.h,
    provinces.map((p) => ({ lat: p.lat, lng: p.lng, color: 'orange', size: markerSize(p.count) })),
  );

  return (
    <div ref={containerRef} className="pointer-events-none relative h-full w-full overflow-hidden rounded-xl border border-[#E6E8EC] bg-slate-100">
      <img src={src} alt="Mapa de provincias" className="h-full w-full object-cover" />
    </div>
  );
}
