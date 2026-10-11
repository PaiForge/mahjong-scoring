"use client";

import type { FuDetail } from "@mahjong-scoring/core";
import { useTranslations } from "next-intl";
import { useFuBreakdown } from "@mahjong-scoring/features/results/use-fu-breakdown";
import { BreakdownPanel } from "./breakdown-panel";
import { DetailTable } from "./detail-table";
import { ScoreTableValueButton } from "./score-table-value-button";

interface FuBreakdownProps {
  /** 切り上げ前の符の内訳 */
  readonly details: readonly FuDetail[];
  /** 切り上げ後の符（正解） */
  readonly answer: number;
  /**
   * `breakdownTotal` / `roundedUp` / `fuSuffix` を持つ翻訳名前空間（例: "totalFu"）
   */
  readonly translationNamespace: string;
}

interface FuBreakdownTableProps extends FuBreakdownProps {
  /**
   * 答えの符（切り上げ後、切り上げが無ければ合計）を押したときの処理。
   * 渡すとその値が点数表を開くボタンになる
   */
  readonly onOpenScoreTable?: () => void;
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
 * 器は点数系の答え合わせと同じ {@link BreakdownPanel}（「内訳を確認」の
 * 1 行の入口で、既定で閉じる）。内訳が符だけなので切り替えは出ない。
 * 符だけを答える練習でも、点数系と内訳の開き方・見え方を変えない。
 * 点数表への導線は持たない — 点数表は翻と符の組で引くもので、符だけでは
 * 引く行が決まらない。
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
 * 合計符の内訳の表（開閉の器なし）
 * 符内訳表
 *
 * 翻数の内訳と切り替えて出す場所（`ScoreBreakdownPanel`）では、開閉は
 * 置く側が持つので表だけを使う。`onOpenScoreTable` を渡すと、答えの符
 * （切り上げ後の符、切り上げが無ければ合計）が点数表を開くボタンになる。
 * 切り上げ前の合計は点数表の行に無いので押せるようにしない。
 */
export function FuBreakdownTable({
  details,
  answer,
  translationNamespace,
  onOpenScoreTable,
}: FuBreakdownTableProps) {
  // 行・合計・切り上げ後の文字列はモバイルと共有する
  const { rows, total, rounded } = useFuBreakdown(
    details,
    answer,
    translationNamespace,
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
