"use client";

import { useTranslations } from "next-intl";
import {
  SpotlightTour,
  spotlightTourLabels,
  type SpotlightStep,
} from "@/app/(user)/_components/spotlight-tour";
import { AGARI_SCORE_TOUR_ID } from "../_lib/tour-ids";

interface ScoreSpotlightTourProps {
  /** 満貫以上を翻数ではなく区分（満貫・跳満…）で答える設定か */
  readonly simplifyMangan: boolean;
  /** 満貫以上でも符を答える設定か */
  readonly requireFuForMangan: boolean;
}

/**
 * 和了形の点数計算の play 画面のヘルプツアー
 * 和了形の点数計算スポットライトツアー
 *
 * 出題文の横の「?」を押すと、盤面と回答欄の各項目を順に照らして 1〜2 文で
 * 説明する。設定画面の「?」（`AgariScoreHelpTour`）が開始前に流れを通しで見せる
 * のに対し、こちらは解いている最中に「この欄に何を入れるか」を実物の上で
 * 答える。役の欄は設定で役の回答を求めるときだけあり、無ければツアーが
 * 飛ばす。翻数と符の説明は出題設定で選択肢と必須の有無が変わるので、
 * 設定に合わせて文言を切り替える — 設定と違う操作を案内すると、従った
 * 人が回答できなくなる。
 *
 * 答え合わせの段階は案内しない。内訳を開く・点数表を見るといった操作は
 * あるが、回答の入力ほど迷わないので、まず回答欄だけに絞っている
 * （出題文ごと「?」が閉じる）。
 */
export function AgariScoreSpotlightTour({
  simplifyMangan,
  requireFuForMangan,
}: ScoreSpotlightTourProps) {
  const t = useTranslations("agariScore.tour");

  const steps: readonly SpotlightStep[] = [
    {
      targetId: AGARI_SCORE_TOUR_ID.board,
      title: t("board.title"),
      description: t("board.description"),
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.yaku,
      title: t("yaku.title"),
      description: t("yaku.description"),
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.han,
      title: t("han.title"),
      description: t(
        simplifyMangan ? "han.descriptionSimplified" : "han.description",
      ),
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.fu,
      title: t("fu.title"),
      description: t(
        requireFuForMangan ? "fu.descriptionRequired" : "fu.description",
      ),
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.score,
      title: t("score.title"),
      description: t("score.description"),
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.submit,
      title: t("submit.title"),
      description: t("submit.description"),
      side: "top",
    },
    {
      targetId: AGARI_SCORE_TOUR_ID.reveal,
      title: t("reveal.title"),
      description: t("reveal.description"),
      side: "top",
    },
  ];

  return <SpotlightTour steps={steps} labels={spotlightTourLabels(t)} />;
}
