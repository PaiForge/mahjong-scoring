import { SCORE_FILTERABLE_YAKU } from "@mahjong-scoring/core";
import type {
  QuestionGeneratorOptions,
  ScoreRange,
} from "@mahjong-scoring/core";
import type { ScoreSettingsState } from "@mahjong-scoring/features/settings/use-score-settings-store";

/** 点数帯の並び（web のクエリ `ranges` を読み直したときと同じ順） */
const RANGE_ORDER: readonly ScoreRange[] = ["nonMangan", "manganPlus"];

/** 点数の無限訓練の判定モード（web の `ScorePracticeModeFlags` から計測を除いたもの） */
export interface ScorePracticeModeFlags {
  /** 役の回答を必須にする */
  readonly requireYaku: boolean;
  /** 満貫以上の翻数を区分名で答える */
  readonly simplifyMangan: boolean;
  /** 満貫以上でも符の回答を必須にする */
  readonly requireFuForMangan: boolean;
  /** 正解時に自動で次の問題へ進む */
  readonly autoNext: boolean;
}

/** 出題条件を組むのに読む設定の値 */
export type ScoreSettingsValues = Pick<
  ScoreSettingsState,
  | "requireYaku"
  | "simplifyMangan"
  | "requireFuForMangan"
  | "autoNext"
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
    simplifyMangan: settings.simplifyMangan,
    requireFuForMangan: settings.requireFuForMangan,
    autoNext: settings.autoNext,
  };
}

/**
 * 設定から出題条件を組む
 * 出題条件解析
 *
 * web の `parseGeneratorOptionsFromParams` と同じ値になる: 手の形は門前・
 * 副露の両方、役の絞り込みは生成器が安定して作れる役
 * （`SCORE_FILTERABLE_YAKU`）に限り、無ければ undefined で明示的に外す
 * （ストアの条件はマージなので、キーを省くと前回の絞り込みが残る）。
 *
 * @param withYakuFilter 役の絞り込みを読むか（待ち別点数計算は持たない）
 */
export function readGeneratorOptions(
  settings: Readonly<ScoreSettingsValues>,
  withYakuFilter: boolean,
): Pick<
  QuestionGeneratorOptions,
  | "allowedRanges"
  | "includeParent"
  | "includeChild"
  | "requiredYaku"
  | "includeFuro"
  | "requireFuro"
> {
  const requiredYaku = withYakuFilter
    ? settings.targetYaku.filter((name) => SCORE_FILTERABLE_YAKU.includes(name))
    : [];
  return {
    allowedRanges: RANGE_ORDER.filter((range) =>
      settings.targetScoreRanges.includes(range),
    ),
    includeParent: settings.includeParent,
    includeChild: settings.includeChild,
    includeFuro: true,
    requireFuro: false,
    requiredYaku: requiredYaku.length > 0 ? requiredYaku : undefined,
  };
}
