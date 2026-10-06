import type { FuDetail } from "@mahjong-scoring/core";
import { useFuBreakdown } from "@mahjong-scoring/features/results/use-fu-breakdown";

import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

/**
 * 符の内訳（web の `FuBreakdown`）
 *
 * 符の理由ごとの表と合計。切り上げで答えと合計が違うときは注記を添える。
 * 辞書は `<namespace>.breakdownTitle` / `fuSuffix` / `breakdownTotal` / `roundUp`。
 */
export function FuBreakdown({
  details,
  answer,
  translationNamespace,
}: {
  readonly details: readonly FuDetail[];
  readonly answer: number;
  readonly translationNamespace: string;
}) {
  // 見出し・行・合計・切り上げの補足の文字列は web と共有する
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
