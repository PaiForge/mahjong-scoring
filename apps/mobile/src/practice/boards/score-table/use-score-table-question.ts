import { useCallback, useMemo, useState } from "react";
import { generateScoreTableQuestion } from "@mahjong-scoring/core";
import type {
  ScoreTableGeneratorOptions,
  ScoreTableQuestion,
} from "@mahjong-scoring/core";
import type { PracticeVariantOf } from "@mahjong-scoring/features/practice-menu-types";
import { generateNextScoreTableQuestion } from "@mahjong-scoring/features/practice/score-table/next-question";
import { SCORE_TABLE_VARIANT_OPTIONS } from "@mahjong-scoring/features/practice/score-table/variants";

import { useRuleSettingsStore } from "../../../hooks/use-rule-settings-store";

/**
 * バリアントをジェネレータオプションとして読むフック
 * 点数表出題オプション
 *
 * web の `useScoreTableGeneratorOptions` の移植（web は URL から読むが、
 * モバイルは正規化済みのバリアントを受け取る）。バリアントの絞り込みに
 * 加えて、ローカルルール設定（切り上げ満貫）も出題オプションへ反映する。
 *
 * チャレンジ（`isTraining` が false）では、切り上げ満貫の採否で正解が割れる
 * セル（60符3翻）を出題から落とす（理由は features の `challenge/rule-boundary.ts`）。
 */
export function useScoreTableGeneratorOptions(
  variant: PracticeVariantOf<"score-table">,
  isTraining: boolean,
): ScoreTableGeneratorOptions {
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  return useMemo(
    () => ({
      ...SCORE_TABLE_VARIANT_OPTIONS[variant],
      kiriageMangan,
      excludeKiriageBoundary: !isTraining,
    }),
    [variant, kiriageMangan, isTraining],
  );
}

/**
 * 点数表早引きの出題状態フック
 * 点数表出題状態
 *
 * web の `useScoreTableQuestion` の移植。現在の問題と「次の問題へ進む」操作を
 * 提供する。正解開示・回答後の遷移のいずれもこの `advance` を呼ぶ。次の問題は
 * 直前と表示が異なるものを引く（{@link generateNextScoreTableQuestion}）。
 *
 * @param generatorOptions 出題条件（親子・点数帯の絞り込み）
 */
export function useScoreTableQuestion(
  generatorOptions: ScoreTableGeneratorOptions,
): { readonly question: ScoreTableQuestion; readonly advance: () => void } {
  const generate = useCallback(
    () => generateScoreTableQuestion(generatorOptions),
    [generatorOptions],
  );
  const [question, setQuestion] = useState<ScoreTableQuestion>(generate);

  const advance = useCallback(() => {
    setQuestion((prev) => generateNextScoreTableQuestion(prev, generate));
  }, [generate]);

  return { question, advance };
}
