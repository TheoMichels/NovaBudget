import { collectionRepository } from "./collectionRepository";
import { monthlyCache } from "./cacheOnly";
import { readCloudSettings, upsertCloudSettings } from "../services/syncService";
import type { MonthlyContributionConfig } from "../types/projection";
const projects = collectionRepository("future_projects", "proj");
const inflows = collectionRepository("inflows", "inflow");
export const getFutureProjects = projects.get;
export const saveFutureProjects = projects.save;
export const addFutureProject = projects.add;
export const updateFutureProject = projects.update;
export const deleteFutureProject = projects.remove;
export const toggleFutureProjectActive = (id: string) => projects.update(id, item => ({ isActive: !item.isActive }));
export const getInflows = inflows.get;
export const saveInflows = inflows.save;
export const addInflow = inflows.add;
export const updateInflow = inflows.update;
export const deleteInflow = inflows.remove;
export const toggleInflowActive = (id: string) => inflows.update(id, item => ({ isActive: !item.isActive }));
export async function getMonthlyContribution(userId?: string): Promise<MonthlyContributionConfig> {
  await readCloudSettings(userId);
  return monthlyCache.read();
}
export async function saveMonthlyContribution(config: MonthlyContributionConfig, userId?: string): Promise<void> {
  const parsed = monthlyCache.parse(config);
  const pendingSave = monthlyCache.set(parsed);
  const version = monthlyCache.version();
  await pendingSave;
  await upsertCloudSettings({ monthly_savings: parsed.monthlyTotal }, userId, { monthly: version });
}
