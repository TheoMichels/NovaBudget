import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Indique si Supabase est correctement configuré avec ses variables d'environnement Expo.
 */
export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith("http") &&
    supabaseUrl !== "https://placeholder.supabase.co"
);

/**
 * Instance Supabase typée avec l'interface Database de NovaBudget.
 * Si les variables d'environnement sont absentes, reste null pour éviter tout crash au démarrage.
 */
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl as string, supabaseAnonKey as string, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

/**
 * Retourne le client Supabase actif ou lance une exception explicite.
 */
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error(
      "Supabase n'est pas configuré. Veuillez renseigner EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return supabase;
}
