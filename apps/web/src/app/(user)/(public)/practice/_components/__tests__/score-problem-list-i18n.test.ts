/**
 * ScoreProblemList 系コンポーネントが引く辞書キーの整合性検証
 *
 * @description
 * `ScoreProblemListLoader` に `translationNamespace` を渡す練習は、
 * 一覧チェーン（score-problem-list / answer-comparison /
 * problem-list-accordion）が引くキー一式をその名前空間に持つ必要がある。
 * next-intl のキー欠落は実行時（結果ページ表示時）まで検出されないため、
 * ここで突き合わせる。mangan_exam 追加時に `han` / `fu` が漏れて
 * MISSING_MESSAGE になった実績があるための再発防止。
 */
import { describe, expect, it } from "vitest";

import messagesJson from "@/messages/ja.json";

/** createCustomResultView に translationNamespace を渡している練習の名前空間 */
const SCORE_PROBLEM_LIST_NAMESPACES = [
  "scoreTableChallenge",
  "scoreCalculationChallenge",
  "manganScoreCalculationChallenge",
  "manganExamChallenge",
] as const;

/** 一覧チェーンが t() で引くキー（ドットはネスト） */
const REQUIRED_KEYS = [
  // score-problem-list.tsx
  "oya",
  "ko",
  "tsumo",
  "ron",
  "han",
  "fu",
  // problem-list-accordion.tsx（result.* を引く）
  "result.problemDetails",
  "result.correct",
  "result.incorrect",
  // answer-comparison.tsx
  "result.correctAnswer",
  "result.yourAnswer",
] as const;

function resolveKey(section: unknown, path: string): unknown {
  return path
    .split(".")
    .reduce<unknown>(
      (node, part) =>
        typeof node === "object" && node !== null
          ? Reflect.get(node, part)
          : undefined,
      section,
    );
}

describe.each(SCORE_PROBLEM_LIST_NAMESPACES)(
  "i18n integrity: %s（問題別フィードバック一覧）",
  (namespace) => {
    const section: unknown = Reflect.get(messagesJson, namespace);

    it.each(REQUIRED_KEYS)("%s が定義されている", (key) => {
      expect(
        typeof resolveKey(section, key),
        `${namespace}.${key} が ja.json に無い`,
      ).toBe("string");
    });
  },
);
