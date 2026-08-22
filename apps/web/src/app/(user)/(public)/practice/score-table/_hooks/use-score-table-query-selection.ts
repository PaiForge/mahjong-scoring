"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { ScoreTableGeneratorOptions } from "@mahjong-scoring/core";
import {
  hasSelectionParams,
  readSelectionParams,
  searchParamsToSelection,
  selectionToGeneratorOptions,
  type ScoreTableSelection,
} from "../_lib/options";

interface ScoreTableQuerySelection {
  /** URL から復元した出題条件（指定の無い軸は全選択） */
  readonly selection: ScoreTableSelection;
  /** URL に出題条件の指定が 1 つでもあったか */
  readonly hasParams: boolean;
}

/**
 * URL クエリから出題条件を読み取るフック
 * URL 出題条件
 *
 * ガイド（/learn/mangan-*）からの遷移で付く `roles` / `wins` / `ranges` を解釈する。
 * サーバー側で `searchParams` を読むとルートが動的になり、初回表示で
 * `loading.tsx` のスケルトンを経由してしまうため、クライアントで読む。
 * 静的ルートでは `useSearchParams()` を使うサブツリーがクライアント描画になるので、
 * 呼び出し側は自前の `Suspense` で包んで fallback を実体に合わせること。
 */
export function useScoreTableQuerySelection(): ScoreTableQuerySelection {
  const searchParams = useSearchParams();
  return useMemo(() => {
    const raw = readSelectionParams(searchParams);
    return {
      selection: searchParamsToSelection(raw),
      hasParams: hasSelectionParams(raw),
    };
  }, [searchParams]);
}

/**
 * URL クエリの出題条件をジェネレータオプションとして読むフック
 * URL 出題オプション
 *
 * play / training の盤面が使う。`useScoreTableQuestion` の依存に渡るため、
 * 参照が毎レンダー変わらないようメモ化する。
 */
export function useScoreTableGeneratorOptions(): ScoreTableGeneratorOptions {
  const { selection } = useScoreTableQuerySelection();
  return useMemo(() => selectionToGeneratorOptions(selection), [selection]);
}
