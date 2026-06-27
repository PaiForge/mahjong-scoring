"use client";

import { useCallback, useState } from "react";
import { generateScoreTableQuestion } from "@mahjong-scoring/core";
import type {
  ScoreTableGeneratorOptions,
  ScoreTableQuestion,
} from "@mahjong-scoring/core";

/**
 * 2問の表示内容（親子・ツモロン・翻・符）が同一かを判定する
 * 表示同一判定
 */
function isSameDisplayedQuestion(
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
 * 点数表早引きの出題状態フック
 * 点数表出題状態
 *
 * 現在の問題と「次の問題へ進む」操作を提供する。スキップ・回答後の遷移の
 * いずれもこの `advance` を呼ぶ。
 *
 * 直前と表示が同一の問題が連続すると、スキップや次問題への遷移で「反応がない」
 * ように見える（特に親子・ツモロン・点数帯を絞ったトレーニングでは表示差が翻数
 * のみになりやすい）。可能な範囲で直前と異なる問題になるまで引き直す。
 * 候補が1種類しかない場合は20回で打ち切る。
 *
 * @param generatorOptions 出題条件（親子・ツモロン・点数帯の絞り込み）
 */
export function useScoreTableQuestion(
  generatorOptions?: ScoreTableGeneratorOptions,
): { question: ScoreTableQuestion; advance: () => void } {
  const [question, setQuestion] = useState<ScoreTableQuestion>(() =>
    generateScoreTableQuestion(generatorOptions),
  );

  const advance = useCallback(() => {
    setQuestion((prev) => {
      let next = generateScoreTableQuestion(generatorOptions);
      for (let i = 0; i < 20 && isSameDisplayedQuestion(prev, next); i++) {
        next = generateScoreTableQuestion(generatorOptions);
      }
      return next;
    });
  }, [generatorOptions]);

  return { question, advance };
}
