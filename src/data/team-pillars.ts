import { Calendar, Layers, TrendingUp } from 'lucide-react';

// Los tres pilares de "Un equipo que conoce tu día a día": se ven igual en la
// home y en /nosotros.
export const TEAM_PILLARS = [
  {
    icon: TrendingUp,
    title: 'Trayectoria real',
    checks: ['Especializados en el sector inmobiliario', 'Más de 11 años de experiencia', 'Visitando a inmobiliarias de toda España'],
  },
  {
    icon: Layers,
    title: 'Servicios',
    subtitle: 'Un único proveedor para todo lo digital',
    checks: ['Gestión de redes', 'Captación de leads', 'Email marketing', 'Automatizaciones IA'],
  },
  {
    icon: Calendar,
    title: 'Condiciones de pago',
    checks: ['Sin pagos por adelantado', 'La fidelidad tiene premio'],
  },
];
