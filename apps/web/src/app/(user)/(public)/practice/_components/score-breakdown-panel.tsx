"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { FuDetail, YakuDetail } from "@mahjong-scoring/core";
import { sumYakuHan } from "@mahjong-scoring/core";
import { useFuHanOrder } from "@/app/_hooks/use-display-settings-store";
import {
  resolveBreakdownTabs,
  type BreakdownJudgement,
} from "@mahjong-scoring/features/results/breakdown-tabs";
import type { ScoreTableFocus } from "@mahjong-scoring/features/score-table/focus";
import { useScoreTableModal } from "@mahjong-scoring/features/score-table/use-score-table-modal";
import { TableIcon } from "@/app/(user)/_components/icons/table-icon";
import { ScoreTableModal } from "@/app/(user)/(public)/reference/score-table/_components/score-table-modal";
import { BreakdownPanel, type BreakdownPanelSection } from "./breakdown-panel";
import { ReferenceLinkButton } from "@/app/(user)/_components/reference-link-button";
import { FuBreakdownTable } from "./fu-breakdown";
import { YakuBreakdownTable } from "./yaku-breakdown";

interface ScoreBreakdownPanelProps {
  /**
   * 符の内訳と正解の符。5 翻以上の問題（符が点数に効かない）と、内訳を
   * 保存する前の旧データでは渡さない。符で満貫に届いた 4 翻以下の問題には渡す
   */
  readonly fu?: {
    readonly details: readonly FuDetail[];
    readonly answer: number;
  };
  /** 役の内訳（ドラ・裏ドラを含む）。保存する前の旧データでは渡さない */
  readonly yakuDetails?: readonly YakuDetail[];
  /** 翻数の合計の後に効く丸めの補足（役満止まりなど） */
  readonly yakuNote?: ReactNode;
  /** 翻数・符の正誤。分かる画面だけが渡し、開いたときに間違えたほうを選ぶ */
  readonly judgement?: BreakdownJudgement;
  /**
   * この問題の正解の位置（親子・ロンツモ・翻・符）。渡すと内訳の答えの値と
   * 内訳の下の「点数表を確認」から点数表をモーダルで開ける
   */
  readonly scoreTableFocus?: ScoreTableFocus;
}

/**
 * 点数系の答え合わせに添える翻数・符の内訳
 * 点数内訳パネル
 *
 * 符の内訳（{@link FuBreakdownTable}）と翻数の内訳（{@link YakuBreakdownTable}）を
 * 1 つの入口から切り替えて読ませる（器は {@link BreakdownPanel}）。昇級試験の
 * 答え合わせと結果ページの問題別詳細で使う。以前は 2 つの開閉を縦に積んで
 * いたが、両方開くと手牌・答え合わせの間が内訳で埋まった。
 *
 * 文言は共通の `challenge` 名前空間から引く（翻数の内訳と同じ理由で、練習
 * ごとの辞書に同じ語を持たせない）。
 *
 * `scoreTableFocus` を渡すと、内訳の答えの値（翻数の合計・符）が正解のセルを
 * ハイライトした点数表を開くボタンになり、内訳の下に「点数表を確認」を添える。
 * 内訳で翻・符を数え直した人が、その組から点数を引く次の一歩まで同じ場所で
 * 確かめられる。
 */
export function ScoreBreakdownPanel({
  fu,
  yakuDetails,
  yakuNote,
  judgement,
  scoreTableFocus,
}: ScoreBreakdownPanelProps) {
  const t = useTranslations("challenge.scoreBreakdown");
  const tScoreTable = useTranslations("scoreTable");
  const scoreTable = useScoreTableModal();
  const openScoreTable =
    scoreTableFocus === undefined ? undefined : scoreTable.open;
  const openHighlighted =
    openScoreTable === undefined ? undefined : () => openScoreTable(true);
  const fuHanOrder = useFuHanOrder();

  const hasYaku = yakuDetails !== undefined && yakuDetails.length > 0;
  const { kinds, initial } = resolveBreakdownTabs(
    fuHanOrder,
    { han: hasYaku, fu: fu !== undefined },
    judgement,
  );

  const sections = kinds.flatMap((kind): BreakdownPanelSection[] => {
    if (kind === "fu" && fu !== undefined) {
      return [
        {
          kind,
          tabLabel: t("fuTab", { value: fu.answer }),
          content: (
            <FuBreakdownTable
              details={fu.details}
              answer={fu.answer}
              translationNamespace="challenge.fuBreakdown"
              onOpenScoreTable={openHighlighted}
            />
          ),
        },
      ];
    }
    if (kind === "han" && yakuDetails !== undefined) {
      return [
        {
          kind,
          tabLabel: t("hanTab", {
            count: sumYakuHan(yakuDetails),
          }),
          content: (
            <YakuBreakdownTable
              yakuDetails={yakuDetails}
              note={yakuNote}
              onOpenScoreTable={openHighlighted}
            />
          ),
        },
      ];
    }
    return [];
  });

  return (
    <>
      <BreakdownPanel
        title={t("toggle")}
        sections={sections}
        initialKind={initial}
        action={
          openScoreTable === undefined ? undefined : (
            <ReferenceLinkButton
              icon={<TableIcon className="size-3.5 shrink-0" />}
              label={tScoreTable("viewScoreTable")}
              hitArea="row"
              onClick={() => openScoreTable(false)}
            />
          )
        }
      />
      {scoreTableFocus !== undefined && (
        <ScoreTableModal
          isOpen={scoreTable.isOpen}
          onClose={scoreTable.close}
          tab={scoreTableFocus}
          highlight={scoreTable.highlighted ? scoreTableFocus : undefined}
        />
      )}
    </>
  );
}
