import { useEffect, useState, type ReactNode } from 'react';

// Valores fijos de Cosiris (promedios de campañas reales).
const FEE = 590;
const CPL = 30;
const LPC = 15;
const VIS = 0.2;
const VEND = 0.5;
const MIN_INV = 300;
const MIN_MES = 3;

const grp = (n: number) => {
  const r = Math.round(Math.abs(n)).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (n < 0 && Math.round(n) !== 0 ? '−' : '') + r;
};
const eur = (n: number) => `${grp(n)} €`;
const n1 = (n: number) => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 1 }).format(n);
const n2 = (n: number) =>
  new Intl.NumberFormat('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

interface Calc {
  inv: number; com: number; mes: number;
  leads: number; vis: number; cap: number; ven: number;
  tAds: number; tCos: number; tInv: number; fac: number; roi: number;
}

function compute(invRaw: number, comRaw: number, mesRaw: number): Calc {
  const inv = Math.max(MIN_INV, invRaw || MIN_INV);
  const com = Math.max(0, comRaw || 0);
  const mes = Math.max(MIN_MES, Math.round(mesRaw || MIN_MES));
  const leads = (inv * mes) / CPL;
  const vis = leads * VIS;
  const cap = leads / LPC;
  const ven = cap * VEND;
  const tAds = inv * mes;
  const tCos = FEE * mes;
  const tInv = tAds + tCos;
  const fac = ven * com;
  return { inv, com, mes, leads, vis, cap, ven, tAds, tCos, tInv, fac, roi: fac - tInv };
}

interface Tip { l: string; d: string; f?: (s: Calc) => string }

const roiTip: Tip = {
  l: 'ROI',
  d: 'Retorno neto: lo que te queda después de restar a la facturación todo lo invertido (publicidad + Cosiris).',
  f: (s) => `Facturación − total inversión\n${eur(s.fac)} − ${eur(s.tInv)} = ${eur(s.roi)}`,
};

const TIPS: Record<string, Tip> = {
  inv: { l: 'Inversión publicitaria mensual', d: 'Presupuesto que destinas cada mes a los anuncios (Meta Ads) para captar propietarios. Lo pagas directamente a la plataforma. Mínimo 300 € al mes.' },
  com: { l: 'Comisión por venta', d: 'Lo que facturas de media por cada inmueble que vendes. Escribe tu comisión media para que el cálculo se ajuste a tu negocio.' },
  mes: { l: 'Duración de la campaña', d: 'Número de meses que mantienes la campaña activa. La contratación mínima es de 3 meses. Multiplica la inversión, el pago a Cosiris y los leads generados.' },
  fee: { l: 'Pago a Cosiris', d: 'Cuota mensual fija por el servicio de Cosiris: gestión de campañas, CRM y seguimiento comercial de los leads.', f: () => 'Precio de tarifa: 590 € al mes, sujeto a condiciones comerciales' },
  cpl: { l: 'CPL promedio', d: 'Coste por lead: lo que cuesta de media conseguir el contacto de un propietario interesado con la inversión publicitaria.', f: () => 'Promedio histórico de Cosiris: 30 € por lead' },
  lpc: { l: 'Leads para 1 captación', d: 'De media hacen falta 15 leads para conseguir que un propietario firme y captes su inmueble.', f: () => 'Promedio histórico de Cosiris: 15 leads' },
  leads: { l: 'Leads generados', d: 'Contactos de propietarios que recibirás durante toda la campaña.', f: (s) => `Inversión mensual × meses ÷ CPL\n${grp(s.inv)} € × ${s.mes} ÷ 30 € = ${n1(s.leads)}` },
  vis: { l: 'Visitas agendadas aprox.', d: 'Visitas a inmuebles que se suelen agendar a partir de los leads: el 20 % de los leads generados.', f: (s) => `Leads × 20 %\n${n1(s.leads)} × 20 % = ${n1(s.vis)}` },
  cap: { l: 'Captaciones promedio', d: 'Inmuebles que se espera captar con los leads de la campaña.', f: (s) => `Leads ÷ 15\n${n1(s.leads)} ÷ 15 = ${n1(s.cap)}` },
  ven: { l: 'Inmuebles vendibles', d: 'De lo captado, se estima que se acaba vendiendo el 50 %.', f: (s) => `Captaciones × 50 %\n${n1(s.cap)} ÷ 2 = ${n1(s.ven)}` },
  tAds: { l: 'Total inversión publicitaria', d: 'Todo lo que inviertes en anuncios durante la campaña.', f: (s) => `Inversión mensual × meses\n${grp(s.inv)} € × ${s.mes} = ${eur(s.tAds)}` },
  tCos: { l: 'Total pago Cosiris', d: 'Todo lo que pagas a Cosiris por el servicio durante la campaña.', f: (s) => `590 € × meses\n590 € × ${s.mes} = ${eur(s.tCos)}` },
  tInv: { l: 'Total inversión', d: 'Suma de la inversión publicitaria y el pago a Cosiris. Es tu coste total.', f: (s) => `Publicidad + Cosiris\n${eur(s.tAds)} + ${eur(s.tCos)} = ${eur(s.tInv)}` },
  fac: { l: 'Facturación', d: 'Lo que ingresas por las comisiones de los inmuebles vendidos.', f: (s) => `Inmuebles vendibles × comisión\n${n1(s.ven)} × ${eur(s.com)} = ${eur(s.fac)}` },
  roi: { ...roiTip, l: 'Retorno neto estimado (ROI)' },
  roiRow: roiTip,
  multRow: { l: 'Retorno por cada 1 €', d: 'Cuánto facturas por cada euro que inviertes entre publicidad y Cosiris.', f: (s) => `Facturación ÷ total inversión\n${eur(s.fac)} ÷ ${eur(s.tInv)} = ${n2(s.tInv ? s.fac / s.tInv : 0)} €` },
};

const CSS = `
.roi-calc{--box:#fff;--ink:#141414;--muted:#7a7a7a;--line:#e8e8e8;--orange:#FF8000;--orange-text:#d96f00;--orange-soft:#fff4e8;--bad:#d23c2c;color:var(--ink);font-size:15px;line-height:1.5}
.roi-calc *{box-sizing:border-box}
.roi-calc .num{font-variant-numeric:tabular-nums}
.roi-calc .sec-t{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--muted);font-weight:600;margin:32px 0 12px;display:flex;align-items:center;gap:10px}
.roi-calc .tag{font-size:10.5px;letter-spacing:.08em;padding:3px 8px;border-radius:99px;background:var(--orange-soft);color:var(--orange-text)}
.roi-calc .tag.fx{background:var(--line);color:var(--muted)}
.roi-calc .grid{display:grid;gap:12px}
.roi-calc .g3{grid-template-columns:repeat(3,minmax(0,1fr))}
.roi-calc .g4{grid-template-columns:repeat(4,minmax(0,1fr))}
.roi-calc .box{background:var(--box);border:1px solid var(--line);border-radius:14px;padding:18px 18px 16px;min-width:0;display:flex;flex-direction:column;gap:10px}
.roi-calc .box .v{font-size:30px;font-weight:700;letter-spacing:-.02em;line-height:1.05}
.roi-calc .box .v small{font-size:14px;font-weight:500;color:var(--muted);margin-left:4px;letter-spacing:0}
.roi-calc .box .sub{font-size:12px;color:var(--muted);margin-top:-4px}
.roi-calc .box.input{border-color:var(--orange);box-shadow:0 0 0 3px var(--orange-soft)}
.roi-calc .box.static-val{background:transparent}
.roi-calc .box.static-val .v{font-size:22px;color:var(--muted)}
.roi-calc .box.key .v{font-size:34px}
.roi-calc .inrow{display:flex;align-items:baseline;gap:6px;border-bottom:1.5px solid var(--line);padding-block:2px 6px;transition:border-color .15s}
.roi-calc .inrow:focus-within{border-color:var(--orange)}
.roi-calc .inrow.err{border-color:var(--bad)}
.roi-calc .inrow input{all:unset;flex:1;min-width:0;font-size:32px;font-weight:700;letter-spacing:-.02em;font-variant-numeric:tabular-nums;color:var(--ink)}
.roi-calc .inrow span{color:var(--muted);font-size:14px;white-space:nowrap}
.roi-calc .inrow input::-webkit-inner-spin-button,.roi-calc .inrow input::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
.roi-calc .inrow input{-moz-appearance:textfield}
.roi-calc input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:20px;background:transparent;margin:0;cursor:pointer}
.roi-calc input[type=range]::-webkit-slider-runnable-track{height:3px;background:var(--line);border-radius:2px}
.roi-calc input[type=range]::-moz-range-track{height:3px;background:var(--line);border-radius:2px}
.roi-calc input[type=range]::-moz-range-progress{height:3px;background:var(--orange)}
.roi-calc input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:var(--orange);margin-top:-6.5px;border:0}
.roi-calc input[type=range]::-moz-range-thumb{width:16px;height:16px;border-radius:50%;background:var(--orange);border:0}
.roi-calc input[type=range]:focus-visible{outline:2px solid var(--orange);outline-offset:4px}
.roi-calc .hint{font-size:12px;color:var(--muted)}
.roi-calc .err-msg{color:var(--bad);font-size:12.5px;line-height:1.35}
.roi-calc .roi-box{margin-top:32px;background:var(--orange);color:#1a1004;border-radius:18px;padding:28px;display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap}
.roi-calc .roi-box.neg{background:var(--bad);color:#fff}
.roi-calc .roi-box .lab button{color:inherit;font-size:14px;font-weight:600}
.roi-calc .roi-box .lab .i{color:inherit;border-color:currentColor}
.roi-calc .roi{font-size:clamp(44px,9vw,76px);font-weight:700;letter-spacing:-.035em;line-height:1;margin-top:10px}
.roi-calc .mult{display:flex;gap:10px;flex-wrap:wrap}
.roi-calc .pill{background:rgba(255,255,255,.28);border-radius:12px;padding:12px 16px;min-width:0}
.roi-calc .pill span{display:block;font-size:12px;font-weight:600;opacity:.75}
.roi-calc .pill strong{display:block;font-size:22px;font-weight:700;letter-spacing:-.01em}
.roi-calc .lab{min-width:0}
.roi-calc .lab button{all:unset;cursor:help;display:inline;font-size:13px;font-weight:500;color:var(--muted);border-radius:3px;line-height:1.3}
.roi-calc .lab button:focus-visible{outline:2px solid var(--orange);outline-offset:3px}
.roi-calc .lab .i{display:inline-block;vertical-align:-2px;margin-left:6px;width:15px;height:15px;border-radius:50%;border:1px solid var(--muted);color:var(--muted);font:600 9.5px/13px inherit;text-align:center;transition:all .15s}
.roi-calc .lab button:hover .i,.roi-calc .lab.open .i,.roi-calc .lab button:focus-visible .i{border-color:var(--orange);background:var(--orange);color:#fff}
.roi-tip{position:fixed;z-index:60;width:min(300px,calc(100vw - 32px));background:#141414;color:#fff;padding:12px 14px;border-radius:10px;font-size:13px;line-height:1.45;box-shadow:0 12px 30px rgba(0,0,0,.2);pointer-events:none;font-weight:400}
.roi-tip b{display:block;font-weight:600;margin-bottom:4px}
.roi-tip .f{display:block;margin-top:8px;padding-top:8px;border-top:1px solid rgba(128,128,128,.35);font-variant-numeric:tabular-nums;font-size:12.5px;white-space:pre-line}
.roi-tip .f i{font-style:normal;color:#FF8000;display:block;font-size:11px;letter-spacing:.08em;text-transform:uppercase;margin-bottom:2px}
.roi-calc .note{font-size:12.5px;color:var(--muted);margin-top:28px;max-width:70ch}
@media (max-width:760px){
  .roi-calc .g4{grid-template-columns:repeat(2,minmax(0,1fr))}
  .roi-calc .g3.inputs{grid-template-columns:1fr}
}
@media (max-width:520px){
  .roi-calc .g3:not(.inputs){grid-template-columns:repeat(2,minmax(0,1fr))}
  .roi-calc .box{padding:14px 14px 12px}
  .roi-calc .box .v{font-size:24px}
  .roi-calc .box.key .v{font-size:26px}
  .roi-calc .roi-box{padding:22px}
  .roi-calc .span-m{grid-column:1/-1}
}
`;

interface TipState { key: string; left: number; top: number; pinned: boolean }

export function RoiCalculator() {
  const [inv, setInv] = useState('500');
  const [com, setCom] = useState('6000');
  const [mes, setMes] = useState('6');
  const [invErr, setInvErr] = useState(false);
  const [mesErr, setMesErr] = useState(false);
  const [tip, setTip] = useState<TipState | null>(null);

  const s = compute(+inv, +com, +mes);

  useEffect(() => {
    if (!tip) return;
    const close = () => setTip(null);
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.roi-calc .lab')) close();
    };
    window.addEventListener('scroll', close, { passive: true });
    window.addEventListener('resize', close);
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    return () => {
      window.removeEventListener('scroll', close);
      window.removeEventListener('resize', close);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
    };
  }, [tip]);

  const showTip = (key: string, el: HTMLElement, pinned: boolean) => {
    const r = el.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const w = Math.min(300, vw - 32);
    const left = Math.min(Math.max(16, r.left), vw - 16 - w);
    setTip({ key, left, top: r.bottom + 8, pinned });
  };

  const lab = (k: string): ReactNode => (
    <div className={`lab${tip?.key === k && tip.pinned ? ' open' : ''}`}>
      <button
        type="button"
        aria-describedby={tip?.key === k ? 'roi-tip' : undefined}
        onMouseEnter={(e) => { if (!tip?.pinned) showTip(k, e.currentTarget, false); }}
        onMouseLeave={() => { if (!tip?.pinned) setTip(null); }}
        onFocus={(e) => { if (!tip?.pinned) showTip(k, e.currentTarget, false); }}
        onBlur={() => setTip(null)}
        onClick={(e) => {
          if (tip?.pinned && tip.key === k) setTip(null);
          else showTip(k, e.currentTarget, true);
        }}
      >
        <span>{TIPS[k].l}</span>
        <span className="i" aria-hidden="true">i</span>
      </button>
    </div>
  );

  // Rango de los sliders: el número puede salirse, el slider se queda al límite.
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const onInvChange = (v: string) => { setInv(v); setInvErr(v !== '' && +v < MIN_INV); };
  const onInvBlur = () => {
    if (inv === '' || isNaN(+inv)) { setInv('500'); setInvErr(false); return; }
    if (+inv < MIN_INV) { setInv(String(MIN_INV)); setInvErr(false); setInvMsg(true); }
    else setInvMsg(false);
  };
  const [invMsg, setInvMsg] = useState(false);
  const [mesMsg, setMesMsg] = useState(false);
  const onMesBlur = () => {
    if (mes === '' || isNaN(+mes)) { setMes('6'); setMesErr(false); return; }
    if (+mes < MIN_MES) { setMes(String(MIN_MES)); setMesErr(false); setMesMsg(true); }
    else { setMes(String(Math.min(Math.round(+mes), 36))); setMesMsg(false); }
  };

  const mult = n2(s.tInv ? s.fac / s.tInv : 0) + ' €';
  const tipDef = tip ? TIPS[tip.key] : null;
  const formula = tipDef?.f?.(s);

  return (
    <div className="roi-calc">
      <style>{CSS}</style>

      <div className="sec-t">Tus datos <span className="tag">Editable</span></div>
      <section className="grid g3 inputs" aria-label="Datos de tu campaña">
        <div className="box input">
          {lab('mes')}
          <label className={`inrow${mesErr ? ' err' : ''}`}>
            <input type="number" inputMode="numeric" min={3} max={36} step={1} value={mes}
              aria-label="Duración de la campaña en meses"
              onChange={(e) => { setMes(e.target.value); setMesErr(e.target.value !== '' && +e.target.value < MIN_MES); setMesMsg(false); }}
              onBlur={onMesBlur} />
            <span>meses</span>
          </label>
          <input type="range" min={3} max={24} step={1} value={clamp(+mes || MIN_MES, 3, 24)}
            aria-label="Duración de la campaña en meses (control deslizante)"
            onChange={(e) => { setMes(e.target.value); setMesErr(false); setMesMsg(false); }} />
          <div className="hint">Mínimo 3 meses de contratación</div>
          {mesMsg && <div className="err-msg">La contratación mínima es de 3 meses. Hemos ajustado el valor.</div>}
        </div>

        <div className="box input">
          {lab('inv')}
          <label className={`inrow${invErr ? ' err' : ''}`}>
            <input type="number" inputMode="numeric" min={300} step={50} value={inv}
              aria-label="Inversión publicitaria mensual"
              onChange={(e) => { onInvChange(e.target.value); setInvMsg(false); }}
              onBlur={onInvBlur} />
            <span>€/mes</span>
          </label>
          <input type="range" min={300} max={5000} step={50} value={clamp(+inv || MIN_INV, 300, 5000)}
            aria-label="Inversión publicitaria mensual (control deslizante)"
            onChange={(e) => { setInv(e.target.value); setInvErr(false); setInvMsg(false); }} />
          <div className="hint">Mínimo 300 € al mes</div>
          {invMsg && <div className="err-msg">La inversión mínima es de 300 € al mes. Hemos ajustado el valor.</div>}
        </div>

        <div className="box input">
          {lab('com')}
          <label className="inrow">
            <input type="number" inputMode="numeric" min={0} step={100} value={com}
              aria-label="Comisión por venta"
              onChange={(e) => setCom(e.target.value)} />
            <span>€</span>
          </label>
          <input type="range" min={1000} max={20000} step={100} value={clamp(+com || 0, 1000, 20000)}
            aria-label="Comisión por venta (control deslizante)"
            onChange={(e) => setCom(e.target.value)} />
          <div className="hint">Tu comisión media por inmueble</div>
        </div>
      </section>

      <section className={`roi-box${s.roi < 0 ? ' neg' : ''}`} aria-live="polite">
        <div>
          {lab('roi')}
          <div className="roi num">{(s.roi > 0 ? '+' : '') + eur(s.roi)}</div>
        </div>
        <div className="mult">
          <div className="pill"><span>Facturación</span><strong className="num">{eur(s.fac)}</strong></div>
          <div className="pill"><span>Por cada 1 € invertido</span><strong className="num">{mult}</strong></div>
        </div>
      </section>

      <div className="sec-t">Resultados de la campaña</div>
      <section className="grid g4">
        <div className="box key">{lab('leads')}<div className="v num">{grp(s.leads)}</div><div className="sub">propietarios interesados</div></div>
        <div className="box key">{lab('vis')}<div className="v num">{grp(s.vis)}</div><div className="sub">20 % de los leads</div></div>
        <div className="box key">{lab('cap')}<div className="v num">{n1(s.cap)}</div><div className="sub">1 por cada 15 leads</div></div>
        <div className="box key">{lab('ven')}<div className="v num">{n1(s.ven)}</div><div className="sub">50 % de lo captado</div></div>
      </section>

      <div className="sec-t">Inversión y retorno</div>
      <section className="grid g3">
        <div className="box">{lab('tAds')}<div className="v num">{eur(s.tAds)}</div></div>
        <div className="box">{lab('tCos')}<div className="v num">{eur(s.tCos)}</div><div className="sub">Precio de tarifa *</div></div>
        <div className="box span-m">{lab('tInv')}<div className="v num">{eur(s.tInv)}</div></div>
      </section>
      <section className="grid g3" style={{ marginTop: 12 }}>
        <div className="box">{lab('fac')}<div className="v num">{eur(s.fac)}</div></div>
        <div className="box" style={{ borderColor: 'var(--orange)' }}>
          {lab('roiRow')}
          <div className="v num" style={{ color: s.roi < 0 ? 'var(--bad)' : 'var(--orange-text)' }}>{eur(s.roi)}</div>
        </div>
        <div className="box span-m">{lab('multRow')}<div className="v num">{mult}</div></div>
      </section>

      <div className="sec-t">Valores fijos Cosiris <span className="tag fx">No editable</span></div>
      <section className="grid g3">
        <div className="box static-val">{lab('fee')}<div className="v num">590 €<small>/mes</small></div><div className="sub">Precio de tarifa sujeto a condiciones comerciales</div></div>
        <div className="box static-val">{lab('cpl')}<div className="v num">30 €</div></div>
        <div className="box static-val span-m">{lab('lpc')}<div className="v num">15<small>leads</small></div></div>
      </section>

      <p className="note">
        * El pago a Cosiris se calcula con el precio de tarifa (590 € al mes), sujeto a condiciones comerciales.
        Cálculo orientativo basado en los promedios de las campañas de Cosiris. Los resultados reales dependen de la
        zona, el mercado y el seguimiento comercial de cada lead.
      </p>

      {tip && tipDef && (
        <div className="roi-tip" id="roi-tip" role="tooltip" style={{ left: tip.left, top: tip.top }}>
          <b>{tipDef.l}</b>
          {tipDef.d}
          {formula && <span className="f"><i>Cómo se calcula</i>{formula}</span>}
        </div>
      )}
    </div>
  );
}
