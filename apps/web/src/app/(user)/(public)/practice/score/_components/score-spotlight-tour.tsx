"use client";

import { useTranslations } from "next-intl";
import {
  SpotlightTour,
  spotlightTourLabels,
  type SpotlightStep,
} from "@/app/(user)/_components/spotlight-tour";
import { SCORE_TOUR_ID } from "../_lib/tour-ids";

/**
 * 点数計算総合演習の play 画面のヘルプツアー
 * 総合演習スポットライトツアー
 *
 * 出題文の横の「?」を押すと、盤面と回答欄の各項目を順に照らして 1〜2 文で
 * 説明する。設定画面の「?」（`ScoreHelpTour`）が開始前に流れを通しで見せる
 * のに対し、こちらは解いている最中に「この欄に何を入れるか」を実物の上で
 * 答える。役の欄は設定で役の回答を求めるときだけあり、無ければツアーが
 * 飛ばす。答え合わせは案内しない — 見比べるだけで操作が無い（出題文ごと
 * 「?」が閉じる）。
 */
export function ScoreSpotlightTour() {
  const t = useTranslations("score.tour");

  const steps: readonly SpotlightStep[] = [
    {
      targetId: SCORE_TOUR_ID.board,
      title: t("board.title"),
      description: t("board.description"),
    },
    {
      targetId: SCORE_TOUR_ID.yaku,
      title: t("yaku.title"),
      description: t("yaku.description"),
    },
    {
      targetId: SCORE_TOUR_ID.han,
      title: t("han.title"),
      description: t("han.description"),
    },
    {
      targetId: SCORE_TOUR_ID.fu,
      title: t("fu.title"),
      description: t("fu.description"),
    },
    {
      targetId: SCORE_TOUR_ID.score,
      title: t("score.title"),
      description: t("score.description"),
    },
    {
      targetId: SCORE_TOUR_ID.submit,
      title: t("submit.title"),
      description: t("submit.description"),
      side: "top",
    },
    {
      targetId: SCORE_TOUR_ID.reveal,
      title: t("reveal.title"),
      description: t("reveal.description"),
      side: "top",
    },
  ];

  return <SpotlightTour steps={steps} labels={spotlightTourLabels(t)} />;
}
