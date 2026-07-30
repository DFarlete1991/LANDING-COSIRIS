// Datos de ejemplo — se usan como fallback mientras no hay inmobiliarias
// reales con mostrar_en_directorio=true en Supabase (ver src/data/live-inmobiliarias.ts,
// que intenta traer datos reales de la vista `directorio_inmobiliarias_publico`
// del CRM y cae a este mock si no hay resultados). Los nombres de campo
// replican los de esa vista, salvo rating/num_opiniones, que NO existen en el
// schema real (no hay sistema de reseñas todavía) — quedan opcionales y solo
// se ven con datos de ejemplo, nunca con datos reales.

export type InmobiliariaPublica = {
  id: string;
  nombre_comercial: string;
  nombre_agente: string;
  direccion: string;
  poblacion: string;
  provincia: string;
  cp: string;
  telefono: string;
  pagina_web: string | null;
  logo_url: string | null;
  /** Encuadre CSS object-position ("X% Y%") guardado por el cliente, estilo WhatsApp. */
  logo_pos?: string | null;
  foto_url: string | null;
  /** Encuadre CSS object-position ("X% Y%") guardado por el cliente, estilo WhatsApp. */
  foto_pos?: string | null;
  banner_url: string | null;
  /** Foto de apoyo del hero del perfil público (oficina, equipo, agente) — opcional, distinta del banner. */
  hero_image_url?: string | null;
  color_hex: string;
  texto_presentacion: string;
  media_presentacion_url: string | null;
  anos_experiencia: number;
  num_empleados: number;
  num_propiedades: number;
  precio_medio: number;
  /** Solo existe en los datos de ejemplo — no hay sistema de reseñas real todavía. */
  rating?: number;
  /** Solo existe en los datos de ejemplo — no hay sistema de reseñas real todavía. */
  num_opiniones?: number;
  idiomas: string[];
  especialidades: string[];
  /** ID de Google Places para obtener reseñas reales vía Places API. */
  google_place_id?: string | null;
  /** null cuando la inmobiliaria (típicamente un cliente de prueba recién aprobado) no fijó su ubicación en el mapa — sigue siendo válida para búsqueda por nombre y estadísticas, pero se excluye de mapa/ciudad/distancia. */
  lat: number | null;
  lng: number | null;
};

export const INMOBILIARIAS_MOCK: InmobiliariaPublica[] = [
  {
    id: 'mock-madrid-centro',
    nombre_comercial: 'Inmoacierta Madrid Centro',
    nombre_agente: 'Carlos Martínez',
    direccion: 'Calle Gran Vía 45',
    poblacion: 'Madrid',
    provincia: 'Madrid',
    cp: '28013',
    telefono: '+34 611 222 333',
    pagina_web: 'https://inmoacierta.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#E85D2A',
    texto_presentacion:
      'Especialistas en compraventa residencial en el centro de Madrid, con más de una década ayudando a familias a encontrar su próxima casa.',
    media_presentacion_url: null,
    anos_experiencia: 12,
    num_empleados: 8,
    num_propiedades: 184,
    precio_medio: 425000,
    rating: 4.8,
    num_opiniones: 92,
    google_place_id: 'REEMPLAZA_CON_TU_PLACE_ID',
    idiomas: ['Español', 'Inglés'],
    especialidades: ['Compraventa', 'Pisos', 'Ático'],
    lat: 40.4200,
    lng: -3.7038,
  },
  {
    id: 'mock-madrid-chamberi',
    nombre_comercial: 'Chamberí Homes',
    nombre_agente: 'Laura Gómez',
    direccion: 'Calle Fuencarral 120',
    poblacion: 'Madrid',
    provincia: 'Madrid',
    cp: '28010',
    telefono: '+34 622 333 444',
    pagina_web: 'https://chamberihomes.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#1E3A5F',
    texto_presentacion:
      'Boutique inmobiliaria enfocada en pisos de alto standing en Chamberí y alrededores.',
    media_presentacion_url: null,
    anos_experiencia: 6,
    num_empleados: 4,
    num_propiedades: 72,
    precio_medio: 580000,
    rating: 4.6,
    num_opiniones: 48,
    idiomas: ['Español', 'Inglés', 'Francés'],
    especialidades: ['Alto standing', 'Pisos', 'Inversión'],
    lat: 40.4350,
    lng: -3.7010,
  },
  {
    id: 'mock-barcelona-eixample',
    nombre_comercial: 'MB Gestors Eixample',
    nombre_agente: 'Marc Bauzà',
    direccion: 'Carrer de Balmes 200',
    poblacion: 'Barcelona',
    provincia: 'Barcelona',
    cp: '08006',
    telefono: '+34 633 444 555',
    pagina_web: 'https://mbgestors.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#B8860B',
    texto_presentacion:
      'Gestión integral de compra, venta y alquiler en el Eixample barcelonés desde 2015.',
    media_presentacion_url: null,
    anos_experiencia: 9,
    num_empleados: 6,
    num_propiedades: 156,
    precio_medio: 510000,
    rating: 4.7,
    num_opiniones: 76,
    idiomas: ['Catalán', 'Español', 'Inglés'],
    especialidades: ['Compraventa', 'Alquiler', 'Gestión'],
    lat: 41.3925,
    lng: 2.1560,
  },
  {
    id: 'mock-barcelona-gracia',
    nombre_comercial: 'Gràcia Propietats',
    nombre_agente: 'Anna Serra',
    direccion: 'Carrer Gran de Gràcia 55',
    poblacion: 'Barcelona',
    provincia: 'Barcelona',
    cp: '08012',
    telefono: '+34 644 555 666',
    pagina_web: null,
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#2E8B57',
    texto_presentacion:
      'Equipo local de Gràcia especializado en pisos con encanto y reformas integrales.',
    media_presentacion_url: null,
    anos_experiencia: 4,
    num_empleados: 3,
    num_propiedades: 43,
    precio_medio: 390000,
    rating: 4.5,
    num_opiniones: 31,
    idiomas: ['Catalán', 'Español'],
    especialidades: ['Pisos', 'Reformas', 'Local'],
    lat: 41.4036,
    lng: 2.1561,
  },
  {
    id: 'mock-valencia-ruzafa',
    nombre_comercial: 'Ruzafa Inmobiliaria',
    nombre_agente: 'Pablo Navarro',
    direccion: 'Calle de Cuba 20',
    poblacion: 'Valencia',
    provincia: 'Valencia',
    cp: '46006',
    telefono: '+34 655 666 777',
    pagina_web: 'https://ruzafainmo.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#D4A017',
    texto_presentacion:
      'Referentes en el barrio de Ruzafa, con foco en inversión y alquiler de larga estancia.',
    media_presentacion_url: null,
    anos_experiencia: 7,
    num_empleados: 5,
    num_propiedades: 98,
    precio_medio: 295000,
    rating: 4.4,
    num_opiniones: 55,
    idiomas: ['Español', 'Inglés'],
    especialidades: ['Inversión', 'Alquiler', 'Viviendas'],
    lat: 39.4620,
    lng: -0.3730,
  },
  {
    id: 'mock-sevilla-nervion',
    nombre_comercial: 'Nervión Casas',
    nombre_agente: 'María Jiménez',
    direccion: 'Avenida de Andalucía 30',
    poblacion: 'Sevilla',
    provincia: 'Sevilla',
    cp: '41005',
    telefono: '+34 666 777 888',
    pagina_web: 'https://nervioncasas.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#C44536',
    texto_presentacion:
      'Más de 15 años acompañando a familias sevillanas en la compra de su vivienda habitual.',
    media_presentacion_url: null,
    anos_experiencia: 15,
    num_empleados: 10,
    num_propiedades: 215,
    precio_medio: 265000,
    rating: 4.9,
    num_opiniones: 134,
    idiomas: ['Español'],
    especialidades: ['Compraventa', 'Familia', 'Primera vivienda'],
    lat: 37.3861,
    lng: -5.9720,
  },
  {
    id: 'mock-bilbao-abando',
    nombre_comercial: 'Abando Real Estate',
    nombre_agente: 'Jon Urrutia',
    direccion: 'Gran Vía Don Diego López de Haro 15',
    poblacion: 'Bilbao',
    provincia: 'Bizkaia',
    cp: '48001',
    telefono: '+34 677 888 999',
    pagina_web: null,
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#2C3E50',
    texto_presentacion:
      'Agencia familiar bilbaína con trato cercano y conocimiento profundo del mercado del Casco Viejo y Abando.',
    media_presentacion_url: null,
    anos_experiencia: 20,
    num_empleados: 5,
    num_propiedades: 167,
    precio_medio: 340000,
    rating: 4.7,
    num_opiniones: 89,
    idiomas: ['Euskera', 'Español', 'Inglés'],
    especialidades: ['Casco Viejo', 'Familia', 'Alquiler'],
    lat: 43.2610,
    lng: -2.9280,
  },
  {
    id: 'mock-malaga-centro',
    nombre_comercial: 'Málaga Sol Propiedades',
    nombre_agente: 'Ana Torres',
    direccion: 'Calle Larios 10',
    poblacion: 'Málaga',
    provincia: 'Málaga',
    cp: '29005',
    telefono: '+34 688 999 000',
    pagina_web: 'https://malagasol.example.com',
    logo_url: null,
    foto_url: null,
    banner_url: null,
    color_hex: '#E67E22',
    texto_presentacion:
      'Especialistas en segunda residencia y venta a compradores internacionales en la Costa del Sol.',
    media_presentacion_url: null,
    anos_experiencia: 11,
    num_empleados: 9,
    num_propiedades: 203,
    precio_medio: 450000,
    rating: 4.3,
    num_opiniones: 67,
    idiomas: ['Español', 'Inglés', 'Alemán'],
    especialidades: ['Segunda residencia', 'Internacional', 'Costa del Sol'],
    lat: 36.7213,
    lng: -4.4214,
  },
];
