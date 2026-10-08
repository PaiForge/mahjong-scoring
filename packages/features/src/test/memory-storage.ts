import type { StateStorage } from "zustand/middleware";

/**
 * 同期で読み書きする保存先（web の localStorage 相当）
 * メモリ保存先
 *
 * 設定・進み具合のストアに注入して、書き込んだ中身を `data` から読む。
 *
 * @param initial - 最初から入っている保存名と値
 */
export function createMemoryStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  const storage: StateStorage = {
    getItem: (name) => data.get(name) ?? null,
    setItem: (name, value) => {
      data.set(name, value);
    },
    removeItem: (name) => {
      data.delete(name);
    },
  };
  return { data, storage };
}

/**
 * 非同期で読み書きする保存先（モバイルの AsyncStorage 相当）
 * 非同期メモリ保存先
 *
 * @param initial - 最初から入っている保存名と値
 */
export function createAsyncStorage(initial: Record<string, string> = {}) {
  const { data, storage } = createMemoryStorage(initial);
  const asyncStorage: StateStorage = {
    getItem: async (name) => storage.getItem(name),
    setItem: async (name, value) => storage.setItem(name, value),
    removeItem: async (name) => storage.removeItem(name),
  };
  return { data, storage: asyncStorage };
}
