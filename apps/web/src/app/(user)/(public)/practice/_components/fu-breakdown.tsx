"use client";

import type { FuDetail } from "@mahjong-scoring/core";
import { useFuBreakdown } from "@mahjong-scoring/features/results/use-fu-breakdown";
import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

interface FuBreakdownProps {
  /** 切り上げ前の符の内訳 */
  readonly details: readonly FuDetail[];
  /** 切り上げ後の符（正解） */
  readonly answer: number;
  /**
   * `breakdownTitle` / `breakdownTotal` / `roundUp` / `fuSuffix` を持つ
   * 翻訳名前空間（例: "totalFu"）
   */
  readonly translationNamespace: string;
}

/**
 * 合計符の内訳表示
 * 符内訳表示
 *
 * 回答後のフィードバックとして、副底から待ち符までの各構成要素と
 * その合計、そして10符単位への切り上げを示す。
 * 内訳の合計と正解が一致しない場合（例: 32符 → 40符）に切り上げの補足を出す。
 *
 * 翻数の内訳（{@link import("./yaku-breakdown").YakuBreakdown}）と同じく
 * 閉じた状態から始める（理由は {@link CollapsibleDetail}）。トレーニングの
 * 答え合わせと結果ページの問題別詳細のどちらでも、内訳の開き方が符と翻数で
 * 変わらない。
 */
export function FuBreakdown({
  details,
  answer,
  translationNamespace,
}: FuBreakdownProps) {
  // 見出し・行・合計・切り上げの補足の文字列はモバイルと共有する
  const { title, rows, total, note } = useFuBreakdown(
    details,
    answer,
    translationNamespace,
  );

  return (
    <CollapsibleDetail title={title}>
      <DetailTable rows={rows} total={total} note={note} />
    </CollapsibleDetail>
  );
}
