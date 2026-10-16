import { cushionCache } from "./cacheOnly";
import { readCloudSettings, upsertCloudSettings } from "../services/syncService";
export { DEFAULT_SAFETY_CUSHION } from "./cacheOnly";
export async function getSafetyCushion(userId?: string): Promise<number> {
  await readCloudSettings(userId);
  return cushionCache.read();
}
export async function saveSafetyCushion(amount: number, userId?: string): Promise<void> {
  const parsed = cushionCache.parse(amount);
  const pendingSave = cushionCache.set(parsed);
  const version = cushionCache.version();
  await pendingSave;
  await upsertCloudSettings({ safety_cushion: parsed }, userId, { cushion: version });
}
