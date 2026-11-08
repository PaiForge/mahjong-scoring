"use client";

import { useTranslations } from "next-intl";
import { buildFuBreakdown } from "@mahjong-scoring/features/results/fu-breakdown";
import { fuReasonLabel } from "@mahjong-scoring/features/results/fu-reason-label";
import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";
import { ScoreTableValueButton } from "./score-table-value-button";
import type {
  FuBreakdownProps,
  FuBreakdownTableProps,
} from "@mahjong-scoring/features/results/breakdown-props";

/**
 * 合計符の内訳表示
 * 符内訳表示
 *
 * 回答後のフィードバックとして、副底から待ち符までの各構成要素と
 * その合計、そして10符単位への切り上げを示す。
 * 内訳の合計と正解が一致しない場合（例: 32符 → 40符）は、合計の下に
 * 切り上げ後の符を結論として出す（{@link FuBreakdownTable}）。
 *
 * 器は点数系の答え合わせと同じ {@link BreakdownPanel}（「内訳を確認」の
 * 1 行の入口で、既定で閉じる）。内訳が符だけなので切り替えは出ない。
 * 符だけを答える練習でも、点数系と内訳の開き方・見え方を変えない。
 * 点数表への導線は持たない — 点数表は翻と符の組で引くもので、符だけでは
 * 引く行が決まらない。開いた表の面（`surface`）は置く側が決める。
 */
export function FuBreakdown({ surface, ...tableProps }: FuBreakdownProps) {
  const t = useTranslations("challenge.scoreBreakdown");

  return (
    <BreakdownPanel
      title={t("toggle")}
      surface={surface}
      sections={[
        {
          kind: "fu",
          tabLabel: t("fuTab", { value: tableProps.answer }),
          content: <FuBreakdownTable {...tableProps} />,
        },
      ]}
    />
  );
}

/**
 * 合計符の内訳の表（開閉の器なし）
 * 符内訳表
 *
 * 翻数の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。`onOpenScoreTable` を渡すと、答えの符
 * （切り上げ後の符、切り上げが無ければ合計）が点数表を開くボタンになる。
 * 切り上げ前の合計は点数表の行に無いので押せるようにしない。
 *
 * 理由の行は core の日本語（`reason`）ではなく、言語に依らない構造（`spec`）から
 * `challenge.fuBreakdown.reasons.*` で組む（{@link fuReasonLabel}）。英語のページに
 * 漢字を残さないため。日本語の辞書の値は core の文言と同じなので日本語の表示は
 * 変わらず、`spec` を持たない古い内訳（保存済みの結果）は `reason` のまま出る。
 * 組み立てはモバイルと共有の {@link buildFuBreakdown} を直接呼ぶ — 共有のフック
 * （`useFuBreakdown`）は理由の整形を受け取らないため。
 */
export function FuBreakdownTable({
  details,
  answer,
  translationNamespace,
  onOpenScoreTable,
}: FuBreakdownTableProps) {
  const t = useTranslations(translationNamespace);
  const tReason = useTranslations("challenge.fuBreakdown");
  // 行・合計・切り上げ後の文字列の組み立てはモバイルと共有する
  const { rows, total, rounded } = buildFuBreakdown(
    details,
    answer,
    t,
    (detail) => fuReasonLabel(detail, tReason),
  );

  const linked = (row: typeof total) =>
    onOpenScoreTable === undefined
      ? row
      : {
          ...row,
          value: (
            <ScoreTableValueButton onClick={onOpenScoreTable}>
              {row.value}
            </ScoreTableValueButton>
          ),
        };

  return (
    <DetailTable
      rows={rows}
      total={rounded === undefined ? linked(total) : total}
      conclusion={rounded === undefined ? undefined : linked(rounded)}
    />
  );
}
