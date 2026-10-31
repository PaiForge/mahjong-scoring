import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import {
  buildScoreGeneratorOptions,
  type ScoreGeneratorOptions,
  type ScorePracticeModeFlags,
} from "@mahjong-scoring/features/practice/score/generator-options";
import type { ScorePracticePick } from "@mahjong-scoring/features/practice/score/lesson-practices";
import type { ScoreSettingsState } from "@mahjong-scoring/features/settings/use-score-settings-store";

/** 出題条件を組むのに読む設定の値 */
export type ScoreSettingsValues = Pick<
  ScoreSettingsState,
  | "requireYaku"
  | "requireHanFu"
  | "exactHan"
  | "requireFuForMangan"
  | "targetScoreRanges"
  | "targetYaku"
  | "includeParent"
  | "includeChild"
>;

/**
 * 設定から判定モードを読む
 * 判定モード解析
 *
 * web は設定画面がクエリに書き、盤面がクエリから読む（`parseModeFlagsFromParams`）。
 * モバイルには共有・リンクされる URL が無いので、盤面は開いたときの設定を
 * そのまま読む。回答時間の計測は Pro の拡張機能で、モバイルには無い。
 */
export function readModeFlags(
  settings: Readonly<ScoreSettingsValues>,
): ScorePracticeModeFlags {
  return {
    requireYaku: settings.requireYaku,
    requireHanFu: settings.requireHanFu,
    exactHan: settings.exactHan,
    requireFuForMangan: settings.requireFuForMangan,
  };
}

/**
 * 設定から出題条件を組む
 * 出題条件解析
 *
 * web の `parseGeneratorOptionsFromParams` と同じ組み立て（`buildScoreGeneratorOptions`）を
 * 通す。設定に手の形は無いので門前・副露の両方、役の絞り込みは生成器が安定して作れる役
 * （`SCORE_FILTERABLE_YAKU`）に限る。
 *
 * 章の「関連する練習」から開いたときは、章の絞り込み（`pick`）で出題する。
 * web が章のリンクのクエリだけで出題するのと同じく、点数帯・親子・役・手の形は
 * 設定を読まない（省略した軸は絞り込まない）。答え方（判定モード）は設定のまま。
 *
 * @param withYakuFilter 役の絞り込みを読むか（聴牌形の点数計算は持たない）
 * @param pick 章の絞り込み。無ければ設定どおり
 */
export function readGeneratorOptions(
  settings: Readonly<ScoreSettingsValues>,
  withYakuFilter: boolean,
  pick?: ScorePracticePick,
): ScoreGeneratorOptions {
  if (pick !== undefined) {
    const ranges = pick.ranges ?? [];
    return buildScoreGeneratorOptions({
      includeNonMangan: ranges.length === 0 || ranges.includes("nonMangan"),
      includeManganPlus: ranges.length === 0 || ranges.includes("manganPlus"),
      includeParent: true,
      includeChild: true,
      requiredYaku: (pick.yaku ?? []).filter((name) =>
        SCORE_FILTERABLE_YAKU.includes(name),
      ),
      handShape: pick.handShape,
    });
  }
  return buildScoreGeneratorOptions({
    includeNonMangan: settings.targetScoreRanges.includes("nonMangan"),
    includeManganPlus: settings.targetScoreRanges.includes("manganPlus"),
    includeParent: settings.includeParent,
    includeChild: settings.includeChild,
    requiredYaku: withYakuFilter
      ? settings.targetYaku.filter((name) =>
          SCORE_FILTERABLE_YAKU.includes(name),
        )
      : [],
    handShape: undefined,
  });
}
