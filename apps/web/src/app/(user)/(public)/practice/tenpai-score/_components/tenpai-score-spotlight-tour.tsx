"use client";

import { useTranslations } from "next-intl";
import { answerFieldsOf } from "@mahjong-scoring/features/practice/help-tour-sample";
import {
  SpotlightTour,
  spotlightTourLabels,
  type SpotlightStep,
} from "@/app/(user)/_components/spotlight-tour";
import { TENPAI_SCORE_TOUR_ID } from "../_lib/tour-ids";

/**
 * 聴牌形の点数計算の play 画面のヘルプツアー
 * 聴牌形スポットライトツアー
 *
 * 各段階の出題文の横の「?」を押すと、今の段階で画面にある操作を順に照らして
 * 1〜2 文で説明する。説明したい操作は出題文の下に並ぶので、ページの見出しより
 * 出題文の横の方が「この画面の操作」の入口として近い。段階（待ち牌の選択 /
 * マスへの当てはめ）ごとに存在する要素が違うため、両方の手順をまとめて渡し、
 * 無い要素はツアーが飛ばす。答え合わせは案内しない — マスを選ぶタブと、
 * 選んだタブの内訳しかなく、説明する操作が無い。マスの段階の回答欄は、マスを選ぶ前も無効状態で
 * 描いてあるので常に案内できる（「役なし」はロンのマスを選んだときだけ
 * 回答欄に現れるため、回答欄の説明の中で触れる）。回答欄の説明は、翻数と符も
 * 答える設定かで「翻・符・点数」と「点数」を言い分ける。
 *
 * @param requireHanFu - 翻数と符も答える設定か
 */
export function TenpaiScoreSpotlightTour({
  requireHanFu,
}: {
  readonly requireHanFu: boolean;
}) {
  const t = useTranslations("tenpaiScore.tour");

  const steps: readonly SpotlightStep[] = [
    // 待ち牌の選択
    {
      targetId: TENPAI_SCORE_TOUR_ID.board,
      title: t("board.title"),
      description: t("board.description"),
    },
    {
      targetId: TENPAI_SCORE_TOUR_ID.picker,
      title: t("picker.title"),
      description: t("picker.description"),
      side: "top",
    },
    {
      targetId: TENPAI_SCORE_TOUR_ID.machiSubmit,
      title: t("machiSubmit.title"),
      description: t("machiSubmit.description"),
      side: "top",
    },
    // マスへの当てはめ
    {
      targetId: TENPAI_SCORE_TOUR_ID.cells,
      title: t("cells.title"),
      description: t("cells.description"),
    },
    {
      targetId: TENPAI_SCORE_TOUR_ID.answerForm,
      title: t("answerForm.title"),
      description: t("answerForm.description", answerFieldsOf(requireHanFu)),
      side: "top",
    },
    {
      targetId: TENPAI_SCORE_TOUR_ID.cellsSubmit,
      title: t("cellsSubmit.title"),
      description: t("cellsSubmit.description"),
      side: "top",
    },
  ];

  return <SpotlightTour steps={steps} labels={spotlightTourLabels(t)} />;
}
