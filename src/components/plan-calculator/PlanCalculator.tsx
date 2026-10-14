import { useEffect, useRef } from 'react';
import { mountPlanCalculator, type PlanLead } from './engine';
import { PLAN_MARKUP } from './markup';
import { LEAD_WEBHOOK_URL, LEAD_EMAIL_WEBHOOK_URL } from '@/lib/lead-webhook';
import { notifyWhatsAppLead } from '@/lib/whatsapp-webhook';
import { getAttributionFields } from '@/lib/utm';
import { DEFAULT_COUNTRY_DIAL, toInternationalPhone } from '@/data/country-codes';
import './plan-calculator.css';
import './plan-calculator.brand.css';

// El formulario de la calculadora es un campo libre: respeta un prefijo
// escrito a mano (+351…, 0033…) y si no lo hay asume España.
function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return toInternationalPhone(DEFAULT_COUNTRY_DIAL, digits);
}

// Los datos los escribe cualquier visitante y acaban dentro de un correo HTML
// interno: se escapan para que nadie pueda colar etiquetas ni enlaces.
const esc = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function buildLeadEmail(lead: PlanLead, phone: string) {
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#64748b;vertical-align:top">${k}</td><td style="padding:6px 0;font-weight:600">${esc(v)}</td></tr>`;
  return {
    subject: `Nuevo lead de la calculadora: ${lead.nombre} (${lead.inmobiliaria})`.slice(0, 180),
    html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">
<h2 style="margin:0 0 4px">Nuevo lead desde la landing: calculadora del plan</h2>
<p style="margin:0 0 16px;color:#64748b">Ha descargado su presupuesto en PDF.</p>
<table style="border-collapse:collapse">${row('Nombre', lead.nombre)}${row('Empresa', lead.inmobiliaria)}${row('Email', lead.email)}${row('Teléfono', phone)}${row('Zona', lead.zona)}${row('Empleados', lead.empleados)}${row('Origen', 'calculadora_plan_pdf')}</table>
<h3 style="margin:20px 0 6px">Plan que ha calculado</h3>
<p style="margin:0;line-height:1.5">${esc(lead.summary)}</p>
</div>`,
  };
}

async function sendPlanLead(lead: PlanLead): Promise<boolean> {
  const payload = {
    name: lead.nombre,
    email: lead.email,
    phone: normalizePhone(lead.telefono),
    company: lead.inmobiliaria,
    zone: lead.zona,
    province: lead.zona,
    employees: lead.empleados,
    services: ['Captación Ads'],
    message: lead.summary,
    source_context: 'calculadora_plan_pdf',
    ...getAttributionFields(),
  };

  notifyWhatsAppLead(payload);

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: 'generate_lead', lead_source: 'calculadora_plan_pdf' });

  const post = (url: string, body: unknown) =>
    fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  // Sheet y correo son independientes: que falle uno no debe tumbar al otro,
  // y al visitante solo le importa que su PDF salga.
  const [sheet] = await Promise.allSettled([
    post(LEAD_WEBHOOK_URL, payload),
    post(LEAD_EMAIL_WEBHOOK_URL, buildLeadEmail(lead, payload.phone)),
  ]);
  return sheet.status === 'fulfilled' && sheet.value.ok;
}

/**
 * Calculadora del plan de captación (4 pasos + informe + PDF). El HTML y la
 * lógica vienen de la versión entregada por Cosiris; aquí solo se monta.
 * `headingTag` permite no repetir un <h1> cuando va dentro de otra página.
 */
export function PlanCalculator({ headingTag = 'h1', className = '' }: { headingTag?: 'h1' | 'h2' | 'h3'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const html = headingTag === 'h1'
    ? PLAN_MARKUP
    : PLAN_MARKUP.replace('<h1 class="pc-h1">', `<${headingTag} class="pc-h1">`).replace('</h1>', `</${headingTag}>`);

  // El HTML se pinta aquí y no con dangerouslySetInnerHTML: la lógica cuelga
  // listeners de los propios elementos, y un DOM nuevo en cada montaje evita
  // que un remontaje (StrictMode, navegación) los duplique y envíe el lead dos veces.
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    root.innerHTML = html;
    const unmount = mountPlanCalculator(root, { onLead: sendPlanLead });
    return () => {
      unmount();
      root.innerHTML = '';
    };
  }, [html]);

  return (
    <div className={`plan-calc ${className}`}>
      <div ref={ref} className="wrap" />
    </div>
  );
}
