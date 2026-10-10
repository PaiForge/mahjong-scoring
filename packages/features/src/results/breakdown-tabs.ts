import { orderFuHan, type FuHanOrder } from "../settings/fu-han-order";

/** 内訳の種類（翻数の内訳 / 符の内訳） */
export type BreakdownKind = "han" | "fu";

/** 翻数・符それぞれの正誤。無回答の正解開示では渡さない */
export interface BreakdownJudgement {
  readonly isHanCorrect: boolean;
  readonly isFuCorrect: boolean;
}

/**
 * 内訳の切り替えに並べる種類と、開いたときに選ぶ種類を決める
 * 内訳切り替え
 *
 * 並びは表示設定の符／翻の順（{@link orderFuHan}）。出題文や要約行と
 * 同じ順で切り替えが並ぶ。
 *
 * 開いたときの選択は、翻・符の片方だけを間違えたならその内訳にする。
 * 確かめたいのは間違えたほうで、切り替えを 1 回省ける。両方合っていた・
 * 両方違った・無回答のときは決め手が無いので、並びの先頭にする。
 *
 * @param order - 符と翻の表記順
 * @param available - 内訳を持つ種類（満貫以上の符など、出さないものは含めない）
 * @param judgement - 翻数・符の正誤。無回答なら undefined
 */
export function resolveBreakdownTabs(
  order: FuHanOrder,
  available: { readonly han: boolean; readonly fu: boolean },
  judgement: BreakdownJudgement | undefined,
): {
  readonly kinds: readonly BreakdownKind[];
  readonly initial: BreakdownKind | undefined;
} {
  const kinds = orderFuHan<BreakdownKind>(order, {
    han: "han",
    fu: "fu",
  }).filter((kind) => available[kind]);

  const mistaken =
    judgement !== undefined && judgement.isHanCorrect !== judgement.isFuCorrect
      ? judgement.isHanCorrect
        ? "fu"
        : "han"
      : undefined;

  return {
    kinds,
    initial:
      mistaken !== undefined && kinds.includes(mistaken) ? mistaken : kinds[0],
  };
}
