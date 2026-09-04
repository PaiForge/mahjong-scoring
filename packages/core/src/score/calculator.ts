import {
  calculateScore,
  type RuleConfig,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";

/**
 * 翻数が変わった場合の点数を再計算する
 * 翻数変更時の点数再計算
 *
 * リーチ・役牌照合のように「手牌（符・役満単位）は変わらないが翻数が
 * 増える」ケースで使う。点数の導出はライブラリの `calculateScore` に委ね、
 * 元の結果から符と役満単位を引き継ぐ。役満役を含む手は役満単位で支払いが
 * 固定され、数え役満は26翻に達しても役満止まりになる（どちらもライブラリの
 * 規則で、後付けの翻で崩れない）。
 *
 * 構造解釈の詳細（`detail`）は翻数の増減で変わらないが、`calculateScore`
 * は手牌を伴わないため結果には含まれない。符の内訳が要る側は元の結果を
 * 参照すること。
 *
 * @param originalResult - 元の点数計算結果
 * @param newHanValue - 新しい翻数
 * @param config - ツモ/ロン・親/子・ルール設定（切り上げ満貫）
 */
export function recalculateScore(
  originalResult: Readonly<ScoreResult>,
  newHanValue: number,
  config: {
    readonly isTsumo: boolean;
    readonly isOya: boolean;
    readonly ruleConfig?: RuleConfig;
  },
): ScoreResult {
  return calculateScore(newHanValue, originalResult.fu, {
    isOya: config.isOya,
    isTsumo: config.isTsumo,
    ruleConfig: config.ruleConfig,
    yakumanMultiplier: originalResult.yakumanMultiplier,
  });
}

/**
 * 切り上げ満貫で点数が変わる結果かどうかを判定する
 * 切り上げ満貫対象判定
 *
 * 30符4翻・60符3翻（基本符1920）が該当する。標準ルールでは満貫未満だが、
 * 切り上げ満貫ルールでは満貫の点数になる — つまり同じ手牌の正解が採用ルール
 * によって割れる唯一の境界。
 *
 * 閾値を持たず、「切り上げ満貫の有無で点数区分が割れるか」をライブラリに
 * 両方計算させて比べる。出題からこの境界を外したい問題生成
 * （`excludeKiriageBoundary`）が閾値を再実装すると、ライブラリ側の定義と
 * 黙ってずれるため。翻数・符だけから判定するので、切り上げを適用した後の
 * 結果（区分が既に満貫）を渡しても正しく判定できる。
 */
export function isKiriageManganTarget(result: Readonly<ScoreResult>): boolean {
  // 親子・ツモロンは点数区分に影響しないため固定でよい
  const config = {
    isOya: false,
    isTsumo: false,
    yakumanMultiplier: result.yakumanMultiplier,
  };
  const standard = calculateScore(result.han, result.fu, config);
  const kiriage = calculateScore(result.han, result.fu, {
    ...config,
    ruleConfig: { kiriageMangan: true },
  });
  return standard.scoreLevel !== kiriage.scoreLevel;
}
