import { collectionCaches, CollectionItems, CollectionName } from "./cacheOnly";
import { readCloudCollection, upsertCloudCollection, deleteCloudItem } from "../services/syncService";

export function collectionRepository<K extends CollectionName>(name: K, prefix: string) {
  const cache = collectionCaches[name];
  type Item = CollectionItems[K];
  async function update(id: string, changes: Partial<Omit<Item, "id">> | ((item: Item) => Partial<Omit<Item, "id">>)): Promise<Item | null> {
    const pendingUpdate = cache.change(current => {
      const existing = current.find(item => item.id === id);
      if (!existing) return { value: current, result: null as Item | null };
      const patch = typeof changes === "function" ? changes(existing) : changes;
      const next = cache.parse([{ ...existing, ...patch, id, updatedAt: new Date().toISOString() }])[0];
      return { value: current.map(item => item.id === id ? next : item), result: next };
    });
    const version = cache.version();
    const updated = await pendingUpdate;
    if (updated) await upsertCloudCollection(name, [updated], undefined, version);
    return updated;
  }
  return {
    get: (userId?: string) => readCloudCollection(name, userId),
    async save(items: Item[], userId?: string): Promise<void> {
      const parsed = cache.parse(items);
      const pendingSave = cache.set(parsed);
      const version = cache.version();
      await pendingSave;
      await upsertCloudCollection(name, parsed, userId, version);
    },
    async add(data: Omit<Item, "id" | "updatedAt">, userId?: string): Promise<Item> {
      const item = cache.parse([{ ...data, id: `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`, updatedAt: new Date().toISOString() }])[0];
      const pendingAdd = cache.change(current => ({ value: [item, ...current], result: undefined }));
      const version = cache.version();
      await pendingAdd;
      await upsertCloudCollection(name, [item], userId, version);
      return item;
    },
    update,
    async remove(id: string): Promise<void> {
      const pendingDelete = cache.change(current => ({ value: current.filter(item => item.id !== id), result: undefined }), "delete");
      const version = cache.version();
      await pendingDelete;
      await deleteCloudItem(name, id, version);
    },
  };
}
