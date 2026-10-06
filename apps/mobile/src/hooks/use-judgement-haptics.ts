import { useEffect, useRef } from "react";

import { hapticJudgement } from "../lib/haptics";

/**
 * 正解 / 不正解の数が増えるたびに触覚で知らせる
 * 正誤の触覚フック
 *
 * 盤面ごとに判定の瞬間を拾い直さなくて済むよう、シェルが持つカウンタの
 * 増分で判定を知る（正解が増えれば正解、不正解が増えれば不正解）。
 * 開いた瞬間（初期値）と 0 に戻るリセットでは鳴らさない。
 *
 * @param correct 正解数
 * @param incorrect 不正解数
 */
export function useJudgementHaptics(correct: number, incorrect: number): void {
  const previous = useRef({ correct, incorrect });
  useEffect(() => {
    const before = previous.current;
    previous.current = { correct, incorrect };
    if (correct > before.correct) hapticJudgement("correct");
    else if (incorrect > before.incorrect) hapticJudgement("incorrect");
  }, [correct, incorrect]);
}
