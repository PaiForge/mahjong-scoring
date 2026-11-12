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
 * アプリの外（web・他の端末・他の利用者の挑戦）で変わる材料を読む画面
 * （ランキングでの自分の順位・マイページ等）を、戻ってきたときに新しくするため、
 * 表示のたびに読み直す。`read` が変わったとき
 * （条件を選び直したとき）も読み直す。呼び出し側は `read` を `useCallback` で
 * 包み、条件が変わったときだけ作り直すこと。`read` が undefined のあいだ
 * （ログインの状態を読んでいる間）は送らずに `loading` のまま待つ。
 *
 * `reload` は読み終えたら（成功でも失敗でも、新しい要求に追い越されても）解決する
 * Promise を返す。引っ張って更新（`usePullToRefresh`）が更新の印を消す合図に使う。
 *
 * `replace` は読み直さずに値を差し替える。書き込みの応答が新しい値を含むとき
 * （取引の記録の応答に記録後のプランが付く等）に、もう 1 往復せず画面へ出す。
 * 読んでいる最中の要求の結果は捨てる（差し替えた値より古い）。
 */
export function useFocusRead<T extends object, E>(
  read: (() => Promise<T | { readonly error: E }>) | undefined,
): {
  readonly state: FocusReadState<T, E>;
  readonly reload: () => Promise<void>;
  readonly replace: (value: T) => void;
} {
  const [state, setState] = useState<FocusReadState<T, E>>({
    kind: "loading",
  });
  // 古い要求の結果が新しい要求の結果を上書きしないよう、最後の要求だけを採る
  const latest = useRef(0);

  const reload = useCallback(async () => {
    if (read === undefined) return;
    const request = ++latest.current;
    setState((prev) =>
      prev.kind === "loaded" ? { ...prev, pending: true } : prev,
    );
    await read().then((result) => {
      if (request !== latest.current) return;
      setState(
        "error" in result
          ? { kind: "failed", error: result.error }
          : { kind: "loaded", value: result, pending: false },
      );
    });
  }, [read]);

  const replace = useCallback((value: T) => {
    latest.current++;
    setState({ kind: "loaded", value, pending: false });
  }, []);

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  return { state, reload, replace };
}
