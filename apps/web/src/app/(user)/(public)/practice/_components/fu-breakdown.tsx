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
   * `breakdownTitle` / `breakdownTotal` / `roundUp` / `roundedUp` / `fuSuffix` を
   * 持つ翻訳名前空間（例: "totalFu"）
   */
  readonly translationNamespace: string;
}

/**
 * 合計符の内訳表示
 * 符内訳表示
 *
 * 回答後のフィードバックとして、副底から待ち符までの各構成要素と
 * その合計、そして10符単位への切り上げを示す。
 * 内訳の合計と正解が一致しない場合（例: 32符 → 40符）は、合計の下に
 * 切り上げ後の符を結論として出す（{@link FuBreakdownTable}）。
 *
 * 翻数の内訳（{@link import("./yaku-breakdown").YakuBreakdown}）と同じく
 * 閉じた状態から始める（理由は {@link CollapsibleDetail}）。トレーニングの
 * 答え合わせと結果ページの問題別詳細のどちらでも、内訳の開き方が符と翻数で
 * 変わらない。
 */
export function FuBreakdown(props: FuBreakdownProps) {
  const { title } = useFuBreakdown(
    props.details,
    props.answer,
    props.translationNamespace,
  );

  return (
    <CollapsibleDetail title={title}>
      <FuBreakdownTable {...props} />
    </CollapsibleDetail>
  );
}

/**
 * 合計符の内訳の表（開閉の器なし）
 * 符内訳表
 *
 * 翻数の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。
 */
export function FuBreakdownTable({
  details,
  answer,
  translationNamespace,
}: FuBreakdownProps) {
  // 行・合計・切り上げ後の文字列はモバイルと共有する
  const { rows, total, rounded } = useFuBreakdown(
    details,
    answer,
    translationNamespace,
  );

  return <DetailTable rows={rows} total={total} conclusion={rounded} />;
}
