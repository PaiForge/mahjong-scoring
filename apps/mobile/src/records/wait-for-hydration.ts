/** zustand の `persist` ミドルウェアが付いたストアのうち、待つのに要る部分 */
interface PersistedStore {
  readonly persist: {
    hasHydrated(): boolean;
    onFinishHydration(listener: () => void): () => void;
  };
}

/**
 * 永続化したストアを保存先（AsyncStorage）から読み終えるまで待つ
 * ストア復元待ち
 *
 * 読み終えていれば即座に解決する。預かり（`useAccountRecordsStore`）と
 * ゲストのレッスン完了（`useLessonCompletionStore`）を、ログイン直後の
 * 取り込みの前に読み終えておくために使う。
 */
export function waitForHydration(store: PersistedStore): Promise<void> {
  const { persist } = store;
  if (persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsubscribe = persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}
