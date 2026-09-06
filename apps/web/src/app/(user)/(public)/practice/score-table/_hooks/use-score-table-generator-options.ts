"use client";

import { useMemo } from "react";
import { useRuleSettingsStore } from "@/app/_hooks/use-rule-settings-store";
import { PRACTICE_SLUG } from "@/lib/db/practice-menu-types";
import type { PracticeVariantOf } from "@/lib/db/practice-menu-types";
import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import { useVariantQuery } from "../../_hooks/use-variant-query";
import { SCORE_TABLE_VARIANT_OPTIONS } from "../_lib/variants";

/**
 * URL クエリから点数表早引きのバリアントを読むフック
 * 点数表バリアント
 *
 * `useVariantQuery` の練習固定版。呼び出し側は `Suspense` で包むこと
 * （静的ルートでは `useSearchParams()` を使うサブツリーがクライアント描画になる）。
 */
export function useScoreTableVariant(): PracticeVariantOf<"score-table"> {
  return useVariantQuery(PRACTICE_SLUG.scoreTable);
}

/**
 * URL クエリのバリアントをジェネレータオプションとして読むフック
 * 点数表出題オプション
 *
 * play / training の盤面が使う。`useScoreTableQuestion` の依存に渡るため、
 * 参照が毎レンダー変わらないようメモ化する。バリアントの絞り込みに加えて、
 * ローカルルール設定（切り上げ満貫）も出題オプションへ反映する。
 */
export function useScoreTableGeneratorOptions(): ScoreTableGeneratorOptions {
  const variant = useScoreTableVariant();
  const kiriageMangan = useRuleSettingsStore((s) => s.kiriageMangan);
  return useMemo(
    () => ({ ...SCORE_TABLE_VARIANT_OPTIONS[variant], kiriageMangan }),
    [variant, kiriageMangan],
  );
}
