import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { EMPTY_ACCOUNT_RECORDS, type AccountRecords } from "./account-records";

interface AccountRecordsStore extends AccountRecords {
  /** 預かりを書き換える（`account-records.ts` の遷移を渡す） */
  readonly update: (
    transition: (records: AccountRecords) => AccountRecords,
  ) => void;
}

/**
 * ログイン中のアカウントのための預かり（AsyncStorage に永続化）
 * アカウント記録ストア
 *
 * 中身と規則は `account-records.ts`。アプリを閉じても残し、次の起動で
 * 続きを送る。
 */
export const useAccountRecordsStore = create<AccountRecordsStore>()(
  persist(
    (set) => ({
      ...EMPTY_ACCOUNT_RECORDS,
      update: (transition) =>
        set((state) =>
          transition({
            byUser: state.byUser,
            guestLessonsImported: state.guestLessonsImported,
          }),
        ),
    }),
    {
      name: "mahjong-account-records",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        byUser: state.byUser,
        guestLessonsImported: state.guestLessonsImported,
      }),
    },
  ),
);

/** 預かりを書き換える（コンポーネントの外から） */
export function updateAccountRecords(
  transition: (records: AccountRecords) => AccountRecords,
): void {
  useAccountRecordsStore.getState().update(transition);
}

/** 預かりを保存先から読み終えるまで待つ */
export function accountRecordsHydrated(): Promise<void> {
  const { persist: store } = useAccountRecordsStore;
  if (store.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = store.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}
