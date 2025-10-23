import { createClient } from '@supabase/supabase-js'

// Obtiene la URL y la llave desde el archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Crea y exporta el cliente de Supabase para que lo podamos usar en otros archivos
export const supabase = createClient(supabaseUrl, supabaseAnonKey)