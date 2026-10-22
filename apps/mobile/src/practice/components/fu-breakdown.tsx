import { useTranslations } from "use-intl";
import { useFuBreakdown } from "@mahjong-scoring/features/results/use-fu-breakdown";

import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";
import type {
  FuBreakdownProps,
  FuBreakdownTableProps,
} from "@mahjong-scoring/features/results/breakdown-props";

/**
 * 符の内訳（web の `FuBreakdown`）
 *
 * 符の理由ごとの表と合計。切り上げで答えと合計が違うときは、合計の下に
 * 切り上げ後の符を結論として出す（{@link FuBreakdownTable}）。辞書は
 * `<namespace>.fuSuffix` / `breakdownTotal` / `roundedUp`。
 *
 * 器は点数系と同じ {@link BreakdownPanel}（「内訳を確認」の 1 行の入口）で、
 * 内訳が符だけなので切り替えは出ない。点数表への導線は持たない（符だけでは
 * 点数表の行が決まらない）。
 */
export function FuBreakdown(props: FuBreakdownProps) {
  const t = useTranslations("challenge.scoreBreakdown");
  return (
    <BreakdownPanel
      title={t("toggle")}
      sections={[
        {
          kind: "fu",
          tabLabel: t("fuTab", { value: props.answer }),
          content: <FuBreakdownTable {...props} />,
        },
      ]}
    />
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
  onOpenScoreTable,
}: FuBreakdownTableProps) {
  const tChallenge = useTranslations("challenge");
  // 行・合計・切り上げ後の文字列は web と共有する
  const { rows, total, rounded } = useFuBreakdown(
    details,
    answer,
    translationNamespace,
  );
  return (
    <DetailTable
      rows={rows}
      total={total}
      conclusion={rounded}
      answerLink={
        onOpenScoreTable === undefined
          ? undefined
          : {
              onPress: onOpenScoreTable,
              accessibilityHint: tChallenge("openInScoreTable"),
            }
      }
    />
  );
}
