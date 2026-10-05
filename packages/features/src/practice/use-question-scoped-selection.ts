"use client";

import { useCallback, useState } from "react";

/**
 * 問題ごとに読み捨てる選択
 * 問題別選択
 *
 * 選んだ値を「どの問題に対するものか」と一緒に持ち、出題番号が変わったら
 * 未選択として読む。effect でリセットすると、問題が変わった最初の描画に
 * 前の問題の選択が 1 フレーム残る（次の問題の選択肢に印が付いて見える）。
 *
 * @param questionIndex 出題番号（問題が変わるたびに進む）
 * @returns 現在の問題での選択（未選択は undefined）と、選ぶ操作
 */
export function useQuestionScopedSelection<T>(
  questionIndex: number,
): readonly [T | undefined, (value: T) => void] {
  const [selection, setSelection] = useState<
    { readonly value: T; readonly questionIndex: number } | undefined
  >(undefined);
  const select = useCallback(
    (value: T) => setSelection({ value, questionIndex }),
    [questionIndex],
  );
  return [
    selection?.questionIndex === questionIndex ? selection.value : undefined,
    select,
  ] as const;
}
