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
 * @param fu - 符の内訳と正解の符。符を出さない問題（5 翻以上）では undefined
 * @param yakuDetails - 役の内訳
 * @param judgement - 翻数・符の正誤。無回答なら undefined
 */
export function buildScoreBreakdownTabs(
  order: FuHanOrder,
  fu: ScoreBreakdownFu | undefined,
  yakuDetails: readonly YakuDetail[],
  judgement: BreakdownJudgement | undefined,
): {
  readonly tabs: readonly ScoreBreakdownTab[];
  readonly initial: BreakdownKind | undefined;
} {
  const { kinds, initial } = resolveBreakdownTabs(
    order,
    { han: yakuDetails.length > 0, fu: fu !== undefined },
    judgement,
  );

  const tabs = kinds.flatMap((kind): ScoreBreakdownTab[] => {
    if (kind === "fu" && fu !== undefined) return [{ kind, fu }];
    if (kind === "han") {
      return [{ kind, yakuDetails, hanTotal: sumYakuHan(yakuDetails) }];
    }
    return [];
  });

  return { tabs, initial };
}

/** `challenge.scoreBreakdown` の辞書を引く翻訳関数のうち、切り替えの見出しの 2 語 */
export type ScoreBreakdownTranslator = (
  key: "fuTab" | "hanTab",
  values: Record<string, number>,
) => string;

/**
 * 点数内訳パネルの切り替えの見出し（「符 30符」「翻数 3翻」）
 * 点数内訳切り替え見出し
 *
 * 符は正解の符、翻数は丸めの前の合計を添える。web・モバイルの
 * `ScoreBreakdownPanel` が同じ文言を出す。
 *
 * @param tab - {@link buildScoreBreakdownTabs} の切り替え 1 つ
 * @param t - `challenge.scoreBreakdown` 名前空間の翻訳関数
 */
export function scoreBreakdownTabLabel(
  tab: ScoreBreakdownTab,
  t: ScoreBreakdownTranslator,
): string {
  return tab.kind === "fu"
    ? t("fuTab", { value: tab.fu.answer })
    : t("hanTab", { count: tab.hanTotal });
}
