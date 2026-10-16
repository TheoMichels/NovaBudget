import { moneySchema, remoteSettingsSchema, validate } from "../types/validation";
import { readStored, writeStored } from "./validatedStorage";
import { getCurrentUser } from "../services/authService";
import { supabase } from "../services/supabaseClient";

export const DEFAULT_SAFETY_CUSHION = 20000;
const STORAGE_KEY = "@novabudget_safety_cushion_v3";

async function getLocalSafetyCushion(): Promise<number> {
  return readStored(STORAGE_KEY, moneySchema, DEFAULT_SAFETY_CUSHION);
}

async function saveLocalSafetyCushion(amount: number): Promise<void> {
  await writeStored(STORAGE_KEY, moneySchema, amount);
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
      const val = validate(remoteSettingsSchema, data).safety_cushion!;
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

