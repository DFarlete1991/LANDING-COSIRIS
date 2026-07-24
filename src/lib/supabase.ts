import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Puede no estar configurado en algunos entornos (ej. preview sin .env) —
// en ese caso el resto del código debe caer a los datos de ejemplo, no romper.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
