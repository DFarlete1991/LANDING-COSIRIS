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
export type HomeTestimonial = { id: string; kind: string; zone: string; person: string; company: string; results: string[]; quote: string };

export const HOME_TESTIMONIALS: HomeTestimonial[] = [
  { id: 'L6xZ3ATkgQY', kind: 'Testimonio', zone: '[Zona]', person: 'Víctor Zaragoza', company: 'CEO · Finques Zaragoza', results: ['[Resultado 1]', '[Resultado 2]'], quote: 'Vendí propiedades imposibles en semanas.' },
  { id: 'GdQ62okgfNM', kind: 'Entrevista', zone: '[Zona]', person: '[Nombre]', company: 'DSS Inmobiliaria', results: ['[Resultado 1]', '[Resultado 2]'], quote: '[Frase literal de la entrevista]' },
  { id: 'NPVs6BnmwME', kind: 'Podcast', zone: '[Zona]', person: '[Nombre]', company: 'La Plana Immobiliària', results: ['[Resultado 1]', '[Resultado 2]'], quote: '[Frase literal de la entrevista]' },
  { id: 'kHXn93oN4VM', kind: 'Podcast', zone: '[Zona]', person: '[Nombre]', company: 'INMOBOOKING', results: ['[Resultado 1]', '[Resultado 2]'], quote: '[Frase literal de la entrevista]' },
];

// Muro de vídeos de /servicios: los de la home y más entrevistas.
export const VIDEO_GRID: VideoTestimonial[] = [
  ...VIDEO_TESTIMONIALS.slice(0, 1),
  { id: '-MWKphfMCqk', title: '¿Qué cambios ha notado Víctor desde que implementó Cosiris?', who: 'Víctor Zaragoza', agency: 'Finques Zaragoza', category: 'Testimonios', short: true },
  ...VIDEO_TESTIMONIALS.slice(1),
  { id: 'AknVr5r5U88', title: '¿Es buen momento para vender en Barcelona?', who: 'Podcast', agency: 'Don Casa', category: 'Entrevistas' },
  { id: 'PQi54L88PzY', title: 'Hay compradores, pero faltan casas', who: 'Entrevista', agency: 'CS Gestiones', category: 'Entrevistas' },
  { id: 'yJ7L_aljrvc', title: 'De policía en Suiza a crear una inmobiliaria en España', who: 'Podcast', agency: 'Grupo Elimari', category: 'Entrevistas' },
  { id: 'qK-HFx-NXtw', title: 'Cómo crear una inmobiliaria desde cero', who: 'Podcast', agency: 'Inmobiliaria Inmara', category: 'Entrevistas' },
  { id: 'xEzU8SCrFj8', title: 'No falta demanda, faltan pisos', who: 'Podcast', agency: 'Núria Vernet', category: 'Entrevistas' },
];
