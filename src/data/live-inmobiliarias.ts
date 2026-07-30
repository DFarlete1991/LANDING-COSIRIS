import { supabase } from '@/lib/supabase';
import type { InmobiliariaPublica } from './inmobiliarias-mock';

// Fila cruda tal como la devuelve la vista pública `directorio_inmobiliarias_publico`
// del CRM (ver scripts/directorio_portal_inmobiliarias.sql). Sin rating/num_opiniones:
// no existen en el schema real, no hay sistema de reseñas todavía.
type DirectorioRow = {
  id: string;
  nombre_comercial: string;
  nombre_agente: string | null;
  direccion: string | null;
  poblacion: string | null;
  provincia: string | null;
  cp: string | null;
  telefono: string | null;
  pagina_web: string | null;
  logo_url: string | null;
  logo_pos: string | null;
  foto_agente_url: string | null;
  foto_agente_pos: string | null;
  banner_url: string | null;
  color_hex: string | null;
  texto_presentacion: string | null;
  media_presentacion_url: string | null;
  anos_experiencia: number | null;
  num_empleados: number | null;
  num_propiedades: number | null;
  precio_medio: number | null;
  idiomas: string[] | null;
  especialidades: string[] | null;
  lat: number | null;
  lng: number | null;
  hero_image_url: string | null;
};

function mapRow(row: DirectorioRow): InmobiliariaPublica {
  // Sin ubicación no hay pin que mostrar en mapa/ciudad/distancia, pero la
  // inmobiliaria sigue existiendo: debe contar en estadísticas y aparecer si
  // se busca por nombre. Cada consumidor basado en ubicación (AgencyMap,
  // city-index, resultados por distancia) filtra lat/lng == null por su cuenta.
  return {
    id: row.id,
    nombre_comercial: row.nombre_comercial,
    nombre_agente: row.nombre_agente ?? row.nombre_comercial,
    direccion: row.direccion ?? '',
    poblacion: row.poblacion ?? '',
    provincia: row.provincia ?? '',
    cp: row.cp ?? '',
    telefono: row.telefono ?? '',
    pagina_web: row.pagina_web,
    logo_url: row.logo_url,
    logo_pos: row.logo_pos,
    foto_url: row.foto_agente_url,
    foto_pos: row.foto_agente_pos,
    banner_url: row.banner_url,
    color_hex: row.color_hex ?? '#FF8000',
    texto_presentacion: row.texto_presentacion ?? '',
    media_presentacion_url: row.media_presentacion_url,
    anos_experiencia: row.anos_experiencia ?? 0,
    num_empleados: row.num_empleados ?? 0,
    num_propiedades: row.num_propiedades ?? 0,
    precio_medio: row.precio_medio ?? 0,
    idiomas: row.idiomas ?? [],
    especialidades: row.especialidades ?? [],
    lat: row.lat,
    lng: row.lng,
    hero_image_url: row.hero_image_url,
  };
}

// Intenta traer inmobiliarias reales (mostrar_en_directorio=true, con
// ubicación) desde Supabase. Devuelve [] si Supabase no está configurado, si
// la vista aún no existe (migración no corrida), o si sale cualquier error —
// nunca lanza, para que quien llame pueda caer al mock sin drama.
export async function fetchLiveInmobiliarias(): Promise<InmobiliariaPublica[]> {
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from('directorio_inmobiliarias_publico')
      .select('*');

    if (error || !data) {
      if (error) console.warn('[live-inmobiliarias] No se pudo leer el directorio real:', error.message);
      return [];
    }

    return (data as DirectorioRow[]).map(mapRow);
  } catch (err) {
    console.warn('[live-inmobiliarias] Error inesperado leyendo el directorio real:', err);
    return [];
  }
}
