// Webhook de n8n que recibe todos los leads de la web (formulario de
// contacto y calculadora del plan): de ahí sale la fila del Sheet.
export const LEAD_WEBHOOK_URL = 'https://n8n.srv1123447.hstgr.cloud/webhook/8383a34e-98f6-45b0-adda-77a6cdaf8abe';

// Webhook de n8n que envía el correo interno por Gmail al equipo comercial.
// Debe estar configurado como POST: recibe un JSON con { subject, html }.
export const LEAD_EMAIL_WEBHOOK_URL = 'https://n8n.srv1123447.hstgr.cloud/webhook/cosirisweb';
