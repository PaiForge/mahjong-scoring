import type { FuDetail } from "@mahjong-scoring/core";
import { useFuBreakdown } from "@mahjong-scoring/features/results/use-fu-breakdown";

import { CollapsibleDetail } from "./collapsible-detail";
import { DetailTable } from "./detail-table";

interface FuBreakdownProps {
  readonly details: readonly FuDetail[];
  readonly answer: number;
  readonly translationNamespace: string;
}

/**
 * 符の内訳（web の `FuBreakdown`）
 *
 * 符の理由ごとの表と合計。切り上げで答えと合計が違うときは、合計の下に
 * 切り上げ後の符を結論として出す（{@link FuBreakdownTable}）。辞書は
 * `<namespace>.breakdownTitle` / `fuSuffix` / `breakdownTotal` / `roundUp` / `roundedUp`。
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
 * 符の内訳の表（開閉の器なし。web の `FuBreakdownTable`）
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
  // 行・合計・切り上げ後の文字列は web と共有する
  const { rows, total, rounded } = useFuBreakdown(
    details,
    answer,
    translationNamespace,
  );
  return <DetailTable rows={rows} total={total} conclusion={rounded} />;
}
