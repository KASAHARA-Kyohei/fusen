import { load } from "@tauri-apps/plugin-store";

type StoreValue = string | boolean | Record<string, unknown>[] | null;

type FusenStore = {
  get<T>(key: string): Promise<T | null | undefined>;
  set(key: string, value: StoreValue): Promise<void>;
  save(): Promise<void>;
};

let storePromise: Promise<FusenStore> | null = null;

async function getStore(): Promise<FusenStore> {
  storePromise ??= load("settings.json", { autoSave: 250, defaults: {} });
  return storePromise;
}

export async function getSetting<T>(key: string): Promise<T | null> {
  const store = await getStore();
  const value = await store.get<T>(key);
  return value ?? null;
}

export async function setSetting(key: string, value: StoreValue): Promise<void> {
  const store = await getStore();
  await store.set(key, value);
  await store.save();
}
