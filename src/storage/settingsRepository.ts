import AsyncStorage from "@react-native-async-storage/async-storage";

const SAFETY_CUSHION_STORAGE_KEY = "@novabudget_safety_cushion_v1";
const DEFAULT_SAFETY_CUSHION = 20000;

export async function getSafetyCushion(): Promise<number> {
  try {
    const val = await AsyncStorage.getItem(SAFETY_CUSHION_STORAGE_KEY);
    if (val !== null) {
      const parsed = parseFloat(val);
      if (!isNaN(parsed) && parsed >= 0) {
        return parsed;
      }
    }
    return DEFAULT_SAFETY_CUSHION;
  } catch (error) {
    console.error("Failed to load safety cushion from storage", error);
    return DEFAULT_SAFETY_CUSHION;
  }
}

export async function saveSafetyCushion(amount: number): Promise<void> {
  try {
    await AsyncStorage.setItem(SAFETY_CUSHION_STORAGE_KEY, String(amount));
  } catch (error) {
    console.error("Failed to save safety cushion to storage", error);
    throw error;
  }
}
