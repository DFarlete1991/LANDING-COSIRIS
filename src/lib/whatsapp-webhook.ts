// En build de producción usa el webhook prod; en dev/preview, el de test.
// Así no dependemos de qué variables estén cargadas en cada entorno de Vercel.
const WHATSAPP_WEBHOOK_URL = import.meta.env.PROD
  ? import.meta.env.VITE_N8N_WHATS_PROD
  : import.meta.env.VITE_N8N_WHATS_TEST;

// Dispara el flujo de WhatsApp en n8n con el lead recién enviado. No se
// espera la respuesta ni se propaga el error: si el webhook de WhatsApp
// falla, el formulario ya se envió por su vía normal y no debe verse afectado.
export function notifyWhatsAppLead(payload: Record<string, unknown>) {
  if (!WHATSAPP_WEBHOOK_URL) return;

  fetch(WHATSAPP_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
