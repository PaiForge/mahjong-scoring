"use client";

import {
  useCallback,
  useMemo,
  useState,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import { asHostedQuestion, useQuestionHost } from "./use-question-host";

/** まだ差し替えが一度も無い（最初の問題をそのまま使う）ことを表す番兵 */
const UNSET = Symbol("unset");

/** クライアント判定は外部変化を持たないため、購読は何もしない */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * `SetStateAction` が更新関数かどうか
 *
 * `typeof action === "function"` だけでは TS が `TQuestion` 自身が関数で
 * ある可能性を残して絞り込めないため、型述語で明示する（`useState` の
 * setter と同じ約束 — 関数を状態として持たない）。
 */
function isUpdater<T>(action: SetStateAction<T>): action is (prev: T) => T {
  return typeof action === "function";
}

/**
 * 盤面の出題状態
 * 出題状態
 *
 * 出題ホスト（{@link useQuestionHost}）があればその問題を返し、差し替えは
 * ホストの次問へ進める操作になる。無ければ自分で問題を作る。
 *
 * 最初の問題はクライアントでだけ作る。`useState(() => generate())` だと
 * web のサーバー描画（静的プリレンダー・dev の動的描画）でも乱数で問題が
 * 作られ、ハイドレーション時にクライアントが別の問題を作り直して表示が
 * 差し替わる。サーバーとハイドレーション中は `undefined` を返し（呼び出し側は
 * プレースホルダを描く）、クライアント判定が立った最初のレンダーで一度だけ
 * 生成する。判定は `useSyncExternalStore` のサーバー用スナップショットで行う
 * ため、ハイドレーションの無いモバイルでは最初のレンダーから問題がある。
 *
 * @param generate 問題を 1 問生成する。最初の問題はこの参照が変わると作り直される
 *   ため、出題条件に依存する場合は `useCallback` で安定させること
 */
export function useGeneratedQuestion<TQuestion>(
  generate: () => TQuestion,
): [TQuestion | undefined, Dispatch<SetStateAction<TQuestion | undefined>>] {
  const host = useQuestionHost();
  const isClient = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot,
  );
  const [stored, setStored] = useState<TQuestion | undefined | typeof UNSET>(
    UNSET,
  );
  const initial = useMemo(
    () => (isClient && !host ? generate() : undefined),
    [isClient, generate, host],
  );
  const question = stored === UNSET ? initial : stored;

  const setQuestion = useCallback<
    Dispatch<SetStateAction<TQuestion | undefined>>
  >(
    (action) => {
      if (host) {
        host.advance();
        return;
      }
      setStored((prev) => {
        const current = prev === UNSET ? initial : prev;
        return isUpdater(action) ? action(current) : action;
      });
    },
    [initial, host],
  );

  return [
    host ? asHostedQuestion<TQuestion>(host.question) : question,
    setQuestion,
  ];
}
