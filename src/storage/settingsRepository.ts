import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";

export const DEFAULT_SAFETY_CUSHION = 20000;
const STORAGE_KEY = "@novabudget_safety_cushion_v3";

async function getLocalSafetyCushion(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(STORAGE_KEY);
    if (val && !isNaN(Number(val))) {
      return Number(val);
    }
  } catch {}
  return DEFAULT_SAFETY_CUSHION;
}

async function saveLocalSafetyCushion(amount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, String(amount));
  } catch {}
}

export async function getSafetyCushion(userId?: string): Promise<number> {
  const localVal = await getLocalSafetyCushion();
  try {
    if (!supabase) return localVal;
    const uid = userId ?? (await getCurrentUser())?.id;
    if (!uid) return localVal;

    const { data, error } = await supabase
      .from("user_settings")
      .select("safety_cushion")
      .eq("user_id", uid)
      .maybeSingle();

    if (error) {
      return localVal;
    }

    if (
      data &&
      data.safety_cushion != null &&
      !isNaN(Number(data.safety_cushion))
    ) {
      const val = Number(data.safety_cushion);
      await saveLocalSafetyCushion(val);
      return val;
    }

    return localVal;
  } catch {
    return localVal;
  }
}

export async function saveSafetyCushion(
  amount: number,
  userId?: string
): Promise<void> {
  await saveLocalSafetyCushion(amount);

  if (!supabase) return;
  const uid = userId ?? (await getCurrentUser())?.id;
  if (!uid) return;

  try {
    await supabase.from("user_settings").upsert(
      {
        user_id: uid,
        safety_cushion: amount,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );
  } catch {}
}

