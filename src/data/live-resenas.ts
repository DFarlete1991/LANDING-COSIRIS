import { supabase } from '@/lib/supabase';

// Reseñas escritas a mano desde el CRM (fallback para inmobiliarias sin
// google_place_id) — ver resenas_inmobiliaria_publico / _resumen en
// scripts/resenas_manuales_cliente.sql del repo del CRM. profile_id ==
// InmobiliariaPublica.id (el id público de la fila de profiles), no el
// user_id de auth — las vistas ya hacen ese join del lado del CRM.
export type ResenaManual = {
  id: string;
  autor_nombre: string;
  rating: number;
  comentario: string;
  created_at: string;
};

export async function fetchResenasManuales(profileId: string): Promise<ResenaManual[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('resenas_inmobiliaria_publico')
      .select('id, autor_nombre, rating, comentario, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as ResenaManual[];
  } catch {
    return [];
  }
}
