/**
 * 例外を投げない Web Storage の読み書き口
 * 安全なストレージ
 *
 * Web Storage は使えない環境で例外を投げる。Safari のプライベートモードや
 * 容量超過では `setItem` が `QuotaExceededError` を、サイトデータを禁止した
 * Chrome では `localStorage` / `sessionStorage` の参照そのものが
 * `SecurityError` を投げる。サーバー上では参照が `ReferenceError` になる。
 *
 * ここを通すと、読めないときは `getItem` が `null`（値が無いときと同じ）を
 * 返し、書けないときは何もしない。呼び出し側は「値が無い」流れだけを
 * 書けばよく、ストレージが使えないことを別に扱わない。端末ローカルの値は
 * どれも失われても困らない補助（設定・結果の受け渡し・引き継ぎ）なので、
 * 失敗は黙って捨てる。
 *
 * zustand の `StateStorage` と同じ形なので、設定ストアの保存先にもそのまま渡せる。
 */
export interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/**
 * 例外を握りつぶす Web Storage を作る
 *
 * @param getStorage - 実体を返す関数。参照自体が投げる環境があるため、
 *   読み書きのたびに try の中で評価する
 */
export function createSafeStorage(getStorage: () => Storage): SafeStorage {
  return {
    getItem(key) {
      try {
        return getStorage().getItem(key);
      } catch {
        return null;
      }
    },
    setItem(key, value) {
      try {
        getStorage().setItem(key, value);
      } catch {
        // 書けなくても画面は動く。失われるのは端末に残す値だけ
      }
    },
    removeItem(key) {
      try {
        getStorage().removeItem(key);
      } catch {
        // 消せなくても次の読み取りは呼び出し側の検証（期限・回 ID 等）が弾く
      }
    },
  };
}

/** 例外を投げない localStorage */
export const safeLocalStorage = createSafeStorage(() => localStorage);

/** 例外を投げない sessionStorage */
export const safeSessionStorage = createSafeStorage(() => sessionStorage);
