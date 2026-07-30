export type ReviewPlaceholder = {
  id: string;
  autor: string;
  rating: number;
  comentario: string;
  fecha: string;
};

// Contenido de muestra para que la sección de reseñas del perfil se vea
// completa mientras se conecta a una fuente de datos real (pendiente:
// tabla de reseñas por inmobiliaria). Sustituir este array por las reseñas
// reales cuando exista esa fuente — el componente que lo consume no necesita
// cambios, solo el origen de los datos.
export const REVIEWS_PLACEHOLDER: ReviewPlaceholder[] = [
  {
    id: '1',
    autor: 'Laura M.',
    rating: 5,
    comentario: 'Nos acompañaron en todo el proceso de venta, muy atentos y transparentes con el precio desde el primer día.',
    fecha: 'Hace 2 meses',
  },
  {
    id: '2',
    autor: 'Carlos R.',
    rating: 5,
    comentario: 'Encontramos piso en menos de un mes gracias a que conocen muy bien la zona.',
    fecha: 'Hace 3 meses',
  },
  {
    id: '3',
    autor: 'Marta S.',
    rating: 4,
    comentario: 'Buena comunicación durante toda la operación. Repetiría sin duda.',
    fecha: 'Hace 5 meses',
  },
];
