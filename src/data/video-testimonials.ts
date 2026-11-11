// Vídeos del canal @cosiris_inv donde habla una inmobiliaria. Todos son
// horizontales para que las tarjetas sean iguales. "Testimonios" es solo para
// clientes confirmados: esta lista es prueba social.
export type VideoTestimonial = {
  id: string;
  title: string;
  who: string;
  agency: string;
  category: 'Testimonios' | 'Entrevistas';
  // Vídeo vertical: su tarjeta es más alta (solo en el muro de /servicios).
  short?: boolean;
  // Repite el testimonio de otro vídeo: no sale en "Todos", solo en su filtro.
  repeat?: boolean;
};

// Cada vídeo es de una persona o inmobiliaria distinta: varias entrevistas a la
// misma persona seguidas parecen el mismo vídeo repetido.
export const VIDEO_TESTIMONIALS: VideoTestimonial[] = [
  { id: 'L6xZ3ATkgQY', title: 'Vendí propiedades imposibles en semanas', who: 'Víctor Zaragoza', agency: 'Finques Zaragoza', category: 'Testimonios' },
  { id: 'wYsXelQtCo8', title: 'Revolucionando el sector inmobiliario en Madrid', who: 'Entrevista', agency: 'Inmobiliaria Capital', category: 'Entrevistas' },
  { id: '8dvmqGZ8nRE', title: 'Cómo encontrar una nave de 1.700 m² en 1 día', who: 'Entrevista', agency: 'Habitat Nou', category: 'Entrevistas' },
  { id: 'kUDuY6Xig1k', title: 'Primeros clientes de Cosiris', who: 'Finques Zaragoza', agency: 'Deltebre', category: 'Testimonios' },
  { id: 'GdQ62okgfNM', title: 'Por qué vender tu piso por tu cuenta suele salir caro', who: 'Entrevista', agency: 'DSS Inmobiliaria', category: 'Entrevistas' },
  { id: 'NPVs6BnmwME', title: 'Una inmobiliaria tradicional adaptada al cambio', who: 'Podcast', agency: 'La Plana Immobiliària', category: 'Entrevistas' },
  { id: 'kHXn93oN4VM', title: 'El negocio no es solo publicar pisos', who: 'Podcast', agency: 'INMOBOOKING', category: 'Entrevistas' },
];

// Tarjetas de la home con el texto literal del guion de Cosiris. Lo que va entre
// corchetes está pendiente de que lo rellene Cosiris: no publicar sin sustituirlo.
export type HomeTestimonial = { id: string; kind: string; zone: string; person: string; company: string; results: string[]; quote: string; short?: boolean };

export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  // Shorts verticales de clientes. Sin cita literal ni resultados: no se pinta nada inventado.
  { id: 'nQXtsTKLQ00', kind: 'Testimonio', zone: "L'Ametlla de Mar", person: '[Nombre]', company: 'Finques Mar', results: ['[Resultado 1]'], quote: '[Frase literal]', short: true },
  { id: 'U1ZYDQfotJc', kind: 'Testimonio', zone: 'Zaragoza', person: '[Nombre]', company: 'CS Gestiones', results: ['[Resultado 1]'], quote: '[Frase literal]', short: true },
  { id: '8mUNQvWAUtk', kind: 'Testimonio', zone: 'Donostia San Sebastián', person: '[Nombre]', company: 'DSS Servicios Inmobiliarios', results: ['[Resultado 1]'], quote: '[Frase literal]', short: true },
  { id: 'Yn59HnVKwrM', kind: 'Testimonio', zone: 'Alcorcón, Madrid', person: '[Nombre]', company: 'Inmara Inmobiliaria', results: ['[Resultado 1]'], quote: '[Frase literal]', short: true },
];

// Shorts de clientes que Cosiris ha elegido: SIEMPRE van los primeros, en este orden.
export const SHORTS_CLIENTES: VideoTestimonial[] = [
  { id: 'nQXtsTKLQ00', title: 'Finques Mar | Ametlla de Mar', who: 'Testimonio', agency: 'Finques Mar', category: 'Testimonios', short: true },
  { id: 'U1ZYDQfotJc', title: 'CS Gestiones | Zaragoza', who: 'Testimonio', agency: 'CS Gestiones', category: 'Testimonios', short: true },
  { id: '8mUNQvWAUtk', title: 'DSS Servicios Inmobiliarios | Donostia San Sebastián', who: 'Testimonio', agency: 'DSS Servicios Inmobiliarios', category: 'Testimonios', short: true },
  { id: 'Yn59HnVKwrM', title: 'Inmara Inmobiliaria | Alcorcón, Madrid', who: 'Testimonio', agency: 'Inmara Inmobiliaria', category: 'Testimonios', short: true },
];

// Muro de vídeos (home, /servicios y buscador de inmobiliarias): primero los
// shorts de clientes y después el resto.
export const VIDEO_GRID: VideoTestimonial[] = [
  ...SHORTS_CLIENTES,
  ...VIDEO_TESTIMONIALS.slice(0, 1),
  { id: '-MWKphfMCqk', title: '¿Qué cambios ha notado Víctor desde que implementó Cosiris?', who: 'Víctor Zaragoza', agency: 'Finques Zaragoza', category: 'Testimonios', short: true, repeat: true },
  ...VIDEO_TESTIMONIALS.slice(1),
  { id: 'AknVr5r5U88', title: '¿Es buen momento para vender en Barcelona?', who: 'Podcast', agency: 'Don Casa', category: 'Entrevistas' },
  { id: 'PQi54L88PzY', title: 'Hay compradores, pero faltan casas', who: 'Entrevista', agency: 'CS Gestiones', category: 'Entrevistas' },
  { id: 'yJ7L_aljrvc', title: 'De policía en Suiza a crear una inmobiliaria en España', who: 'Podcast', agency: 'Grupo Elimari', category: 'Entrevistas' },
  { id: 'qK-HFx-NXtw', title: 'Cómo crear una inmobiliaria desde cero', who: 'Podcast', agency: 'Inmobiliaria Inmara', category: 'Entrevistas' },
  { id: 'xEzU8SCrFj8', title: 'No falta demanda, faltan pisos', who: 'Podcast', agency: 'Núria Vernet', category: 'Entrevistas' },
  { id: 'rfdXnmc1C-I', title: 'Cuando vender una casa es mucho más que una venta', who: 'Podcast', agency: 'Finques Mar', category: 'Entrevistas' },
  { id: 'bCOLUUFnLVg', title: 'Por qué no captas (y nadie te lo dice)', who: 'Víctor Zaragoza', agency: 'Finques Zaragoza', category: 'Entrevistas' },
  { id: 'RRMdW8X_mPo', title: 'Vendieron un piso en 20 minutos, sin trucos ni promesas mágicas', who: 'Entrevista', agency: 'CS Gestiones', category: 'Entrevistas' },
  { id: 'pUM7kt0Tcwk', title: 'Cómo una inmobiliaria de barrio está construyendo una marca', who: 'Entrevista', agency: 'MUNDOCASA', category: 'Entrevistas' },
  { id: 'R_7zn3MrXK0', title: 'Captar viviendas es el mayor reto inmobiliario', who: 'Podcast', agency: 'Global Home', category: 'Entrevistas' },
  { id: 'jKibnXozIxI', title: '37 años como inmobiliario: «No prometas lo que no puedes cumplir»', who: 'Podcast', agency: 'Pedro Moya', category: 'Entrevistas' },
  { id: 'dFwCiEpjvDs', title: 'Montaron una inmobiliaria justo antes de la pandemia', who: 'Podcast', agency: 'Valor Úbeda', category: 'Entrevistas' },
  { id: 'SVG8s0cOxng', title: 'Los que le dan mandanga al sector inmobiliario', who: 'Podcast', agency: 'Mandanga Inmobiliaria', category: 'Entrevistas' },
  { id: 'Cxeslgt3RXQ', title: 'De Argentina a Salou: una inmobiliaria de confianza desde cero', who: 'Podcast', agency: 'MYC', category: 'Entrevistas' },
  { id: 'kVKjmVZqgrg', title: 'De vender alarmas a montar su inmobiliaria con 25 años', who: 'Podcast', agency: 'Propiaria', category: 'Entrevistas' },
  { id: '6-ct5VxR7Cg', title: 'La DANA, Alcàsser y una inmobiliaria familiar', who: 'Podcast', agency: 'OSGIAL', category: 'Entrevistas' },
  { id: 'xfdR1SSyEmk', title: 'El mercado inmobiliario real en Torredembarra', who: 'Podcast', agency: 'Grupo Torresol', category: 'Entrevistas' },
  { id: '94hhkbHXa18', title: "Quan el problema no és l'habitatge, sinó el mètode", who: 'Podcast', agency: 'Pere Gavaldà', category: 'Entrevistas' },
  { id: '5aF4ICwHFPk', title: 'Dejó España y ahora vende propiedades de lujo en Dubái', who: 'Podcast', agency: 'Marc Nonn', category: 'Entrevistas' },
];
