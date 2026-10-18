import { sumYakuHan } from "@mahjong-scoring/core";
import type { FuDetail, YakuDetail } from "@mahjong-scoring/core";

import type { FuHanOrder } from "../settings/fu-han-order";
import {
  resolveBreakdownTabs,
  type BreakdownJudgement,
  type BreakdownKind,
} from "./breakdown-tabs";

/** 符の内訳と正解の符 */
export interface ScoreBreakdownFu {
  readonly details: readonly FuDetail[];
  readonly answer: number;
}

/** 点数内訳パネルの切り替え 1 つ分（符の内訳 / 翻数の内訳） */
export type ScoreBreakdownTab =
  | { readonly kind: "fu"; readonly fu: ScoreBreakdownFu }
  | {
      readonly kind: "han";
      readonly yakuDetails: readonly YakuDetail[];
      /** 翻数の合計（丸めの前） */
      readonly hanTotal: number;
    };

/**
 * 点数内訳パネルに並べる切り替えと、開いたときに選ぶ種類を決める
 * 点数内訳切り替え
 *
 * web・モバイルの `ScoreBreakdownPanel` が共有する。符は渡されたときだけ、
 * 翻数は役の内訳が 1 行以上あるときだけ並べ、並びと開いたときの選択は
 * {@link resolveBreakdownTabs} に従う。各タブの中身（表）と見出しの文言は
 * プラットフォームの部品が組み立てる。
 *
 * @param order - 符と翻の表記順
 * @param fu - 符の内訳と正解の符。符を出さない問題・旧データでは undefined
 * @param yakuDetails - 役の内訳。旧データでは undefined
 * @param judgement - 翻数・符の正誤。無回答なら undefined
 */
export function buildScoreBreakdownTabs(
  order: FuHanOrder,
  fu: ScoreBreakdownFu | undefined,
  yakuDetails: readonly YakuDetail[] | undefined,
  judgement: BreakdownJudgement | undefined,
): {
  readonly tabs: readonly ScoreBreakdownTab[];
  readonly initial: BreakdownKind | undefined;
} {
  const hasYaku = yakuDetails !== undefined && yakuDetails.length > 0;
  const { kinds, initial } = resolveBreakdownTabs(
    order,
    { han: hasYaku, fu: fu !== undefined },
    judgement,
  );

  const tabs = kinds.flatMap((kind): ScoreBreakdownTab[] => {
    if (kind === "fu" && fu !== undefined) return [{ kind, fu }];
    if (kind === "han" && yakuDetails !== undefined) {
      return [{ kind, yakuDetails, hanTotal: sumYakuHan(yakuDetails) }];
    }
    return [];
  });

  return { tabs, initial };
}
