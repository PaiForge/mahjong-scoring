import type { ScoreTableQuestion } from "@mahjong-scoring/core";

/** 直前と同じ表示の問題を引き直す上限（候補が 1 種類しかない絞り込みで打ち切るため） */
const MAX_REROLLS = 20;

/**
 * 2問の表示内容（親子・ツモロン・翻・符）が同一かを判定する
 * 表示同一判定
 */
export function isSameDisplayedQuestion(
  a: ScoreTableQuestion,
  b: ScoreTableQuestion,
): boolean {
  return (
    a.isOya === b.isOya &&
    a.isTsumo === b.isTsumo &&
    a.han === b.han &&
    a.fu === b.fu
  );
}

/**
 * 直前と表示が異なる次の問題を生成する
 * 点数表次問生成
 *
 * 直前と表示が同一の問題が連続すると、開示後や回答後の次問題への遷移で
 * 「反応がない」ように見える（特に親子・ツモロン・点数帯を絞った出題では
 * 表示差が翻数のみになりやすい）。可能な範囲で直前と異なる問題になるまで
 * 引き直す。候補が 1 種類しかない場合は {@link MAX_REROLLS} 回で打ち切る。
 *
 * @param previous 直前の問題（最初の問題なら undefined）
 * @param generate 問題を 1 つ生成する関数
 */
export function generateNextScoreTableQuestion(
  previous: ScoreTableQuestion | undefined,
  generate: () => ScoreTableQuestion,
): ScoreTableQuestion {
  let next = generate();
  for (
    let i = 0;
    previous !== undefined &&
    i < MAX_REROLLS &&
    isSameDisplayedQuestion(previous, next);
    i++
  ) {
    next = generate();
  }
  return next;
}
