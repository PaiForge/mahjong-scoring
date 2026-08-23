"use client";

import { useCallback, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useIsClient } from "@/app/_hooks/use-is-client";

/** まだ差し替えが一度も無い（最初の問題をそのまま使う）ことを表す番兵 */
const UNSET = Symbol("unset");

/**
 * 最初の問題をクライアントでだけ生成する出題状態
 * クライアント出題状態
 *
 * `useState(() => generate())` だとサーバー描画（本番の静的プリレンダー・dev の
 * 動的描画）でも乱数で問題が作られ、ハイドレーション時にクライアントが別の問題を
 * 作り直して表示が差し替わる（dev ではハイドレーション不一致エラーになる）。
 * サーバーとハイドレーション中は `undefined` を返し（呼び出し側はプレースホルダを
 * 描く）、クライアント判定が立った最初のレンダーで一度だけ生成する。
 * 以降の差し替えは返した setter で行い、`useState` と同じ感覚で使える。
 *
 * effect で setState する形にしないのは、追加レンダーを避けるのと
 * `react-hooks/set-state-in-effect` に従うため（`useIsClient` と同じ理由）。
 *
 * @param generate 問題を 1 問生成する。最初の問題はこの参照が変わると作り直される
 *   ため、出題条件に依存する場合は `useCallback` で安定させること
 */
export function useClientGeneratedQuestion<TQuestion>(
  generate: () => TQuestion,
): [TQuestion | undefined, Dispatch<SetStateAction<TQuestion | undefined>>] {
  const isClient = useIsClient();
  const [stored, setStored] = useState<TQuestion | undefined | typeof UNSET>(
    UNSET,
  );
  const initial = useMemo(
    () => (isClient ? generate() : undefined),
    [isClient, generate],
  );
  const question = stored === UNSET ? initial : stored;

  const setQuestion = useCallback<
    Dispatch<SetStateAction<TQuestion | undefined>>
  >(
    (action) => {
      setStored((prev) => {
        const current = prev === UNSET ? initial : prev;
        return typeof action === "function"
          ? (action as (prev: TQuestion | undefined) => TQuestion | undefined)(
              current,
            )
          : action;
      });
    },
    [initial],
  );

  return [question, setQuestion];
}
