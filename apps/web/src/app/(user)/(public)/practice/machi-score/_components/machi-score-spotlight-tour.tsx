"use client";

import { useTranslations } from "next-intl";
import { SpotlightTour } from "../../_components/spotlight-tour";
import type { SpotlightStep } from "../../_components/spotlight-tour";
import { MACHI_SCORE_TOUR_ID } from "../_lib/tour-ids";

/**
 * 待ち別点数計算の play 画面のヘルプツアー
 * 待ち別スポットライトツアー
 *
 * 見出し右端の「?」を押すと、今の段階で画面にある操作を順に照らして
 * 1〜2 文で説明する。段階（待ち牌の選択 / マスへの当てはめ / 答え合わせ）
 * ごとに存在する要素が違うため、全段階の手順をまとめて渡し、無い要素は
 * ツアーが飛ばす。マスの段階の回答欄と「役なし」は、マスを選ぶ前も
 * 無効状態で描いてあるので常に案内できる。
 */
export function MachiScoreSpotlightTour() {
  const t = useTranslations("machiScore.tour");

  const steps: readonly SpotlightStep[] = [
    // 待ち牌の選択
    {
      targetId: MACHI_SCORE_TOUR_ID.board,
      title: t("board.title"),
      description: t("board.description"),
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.picker,
      title: t("picker.title"),
      description: t("picker.description"),
      side: "top",
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.machiSubmit,
      title: t("machiSubmit.title"),
      description: t("machiSubmit.description"),
      side: "top",
    },
    // マスへの当てはめ
    {
      targetId: MACHI_SCORE_TOUR_ID.cells,
      title: t("cells.title"),
      description: t("cells.description"),
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.selectColumn,
      title: t("selectColumn.title"),
      description: t("selectColumn.description"),
      align: "center",
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.answerForm,
      title: t("answerForm.title"),
      description: t("answerForm.description"),
      side: "top",
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.noYaku,
      title: t("noYaku.title"),
      description: t("noYaku.description"),
      side: "top",
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.cellsSubmit,
      title: t("cellsSubmit.title"),
      description: t("cellsSubmit.description"),
      side: "top",
    },
    // 答え合わせ
    {
      targetId: MACHI_SCORE_TOUR_ID.resultSummary,
      title: t("resultSummary.title"),
      description: t("resultSummary.description"),
    },
    {
      targetId: MACHI_SCORE_TOUR_ID.resultDetail,
      title: t("resultDetail.title"),
      description: t("resultDetail.description"),
      side: "top",
    },
  ];

  return (
    <SpotlightTour
      steps={steps}
      labels={{
        label: t("label"),
        prev: t("prev"),
        next: t("next"),
        done: t("done"),
      }}
    />
  );
}
