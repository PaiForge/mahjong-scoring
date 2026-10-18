import { isFuRelevant, isMangan } from "@mahjong-scoring/core";
import type { ScoreQuestion } from "@mahjong-scoring/core";

/** 答え合わせで符をどこまで見せるか */
export interface FuVisibility {
  /** 符の行（正解の符と回答の符）を出すか */
  readonly row: boolean;
  /** 符の内訳を出すか */
  readonly breakdown: boolean;
}

/**
 * 正解の点数から、答え合わせで符の行と符の内訳を出すかを決める
 * 符表示判定
 *
 * 満貫以上は符の行を出さない（符を答えさせる設定を除く）。符の内訳は、
 * 符で満貫に届いた手（3 翻 70 符等）では符の行が無くても出す。満貫になった
 * 理由が符にあるため。5 翻以上は符が点数に効かないので出さない
 * （{@link isFuRelevant}）。
 *
 * 和了形の結果と昇級試験の盤面が同じ境目で符を出すよう、ここに 1 つだけ持つ。
 *
 * @param answer - 正解の点数計算結果
 * @param options.requireFuForMangan - 満貫以上でも符を答えさせる設定か
 */
export function resolveFuVisibility(
  answer: Pick<ScoreQuestion["answer"], "han" | "scoreLevel">,
  { requireFuForMangan }: { readonly requireFuForMangan: boolean },
): FuVisibility {
  const row = !isMangan(answer.scoreLevel) || requireFuForMangan;
  return { row, breakdown: row || isFuRelevant(answer.han) };
}
