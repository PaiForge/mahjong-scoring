import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";

/**
 * 画面の読み込み状態
 *
 * - `loading` — まだ 1 度も読めていない
 * - `loaded` — 読めた。読み直している間も前の値を出し続け、`pending` で知らせる
 *   （条件を選び直した直後の値は前の条件のものなので、画面は薄く描く）
 * - `failed` — 読めなかった
 */
export type FocusReadState<T, E> =
  | { readonly kind: "loading" }
  | { readonly kind: "loaded"; readonly value: T; readonly pending: boolean }
  | { readonly kind: "failed"; readonly error: E };

/**
 * 画面の材料を読み、画面を開くたびに読み直す
 * 画面読み込み
 *
 * 他の人の記録や設定が変わる画面（ランキング・公開プロフィール）を、戻って
 * きたときに新しくするため、表示のたびに読み直す。`read` が変わったとき
 * （条件を選び直したとき）も読み直す。呼び出し側は `read` を `useCallback` で
 * 包み、条件が変わったときだけ作り直すこと。`read` が undefined のあいだ
 * （ログインの状態を読んでいる間）は送らずに `loading` のまま待つ。
 */
export function useFocusRead<T extends object, E>(
  read: (() => Promise<T | { readonly error: E }>) | undefined,
): {
  readonly state: FocusReadState<T, E>;
  readonly reload: () => void;
} {
  const [state, setState] = useState<FocusReadState<T, E>>({
    kind: "loading",
  });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  const reload = useCallback(() => {
    if (read === undefined) return;
    const request = ++latest.current;
    setState((prev) =>
      prev.kind === "loaded" ? { ...prev, pending: true } : prev,
    );
    void read().then((result) => {
      if (request !== latest.current) return;
      setState(
        "error" in result
          ? { kind: "failed", error: result.error }
          : { kind: "loaded", value: result, pending: false },
      );
    });
  }, [read]);

  useFocusEffect(reload);

  return { state, reload };
}
