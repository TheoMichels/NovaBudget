import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";

export const DEFAULT_SAFETY_CUSHION = 20000;

export async function getSafetyCushion(userId?: string): Promise<number> {
  try {
    if (!supabase) return DEFAULT_SAFETY_CUSHION;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return DEFAULT_SAFETY_CUSHION;

    const { data, error } = await supabase
      .from("user_settings")
      .select("safety_cushion")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      console.error("Failed to load safety cushion from Supabase:", error);
      return DEFAULT_SAFETY_CUSHION;
    }

    if (
      data &&
      data.safety_cushion != null &&
      !isNaN(Number(data.safety_cushion))
    ) {
      return Number(data.safety_cushion);
    }

    return DEFAULT_SAFETY_CUSHION;
  } catch (error) {
    console.error("Failed to load safety cushion from Supabase:", error);
    return DEFAULT_SAFETY_CUSHION;
  }
}

export async function saveSafetyCushion(
  amount: number,
  userId?: string
): Promise<void> {
  if (!supabase) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  const { error } = await supabase.from("user_settings").upsert(
    {
      user_id: uid,
      safety_cushion: amount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) {
    console.error("Failed to save safety cushion to Supabase:", error);
    throw error;
  }
}
