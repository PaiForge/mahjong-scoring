"use client";

import { useTranslations } from "next-intl";

import {
  SpotlightTour,
  spotlightTourLabels,
  type SpotlightStep,
} from "@/app/(user)/_components/spotlight-tour";
import { AGARI_SCORE_RESULT_TOUR_ID } from "@/app/(user)/(public)/practice/agari-score/_lib/tour-ids";

/**
 * 早見表の連動サンプルのヘルプツアー
 * 連動サンプルスポットライトツアー
 *
 * 正解の役と点数を順に照らし、押すと何が開くかを 1 文で伝える。ページは
 * 開いた直後に盤面へスクロールし、見出しの「?」は最初の画面に入らない。
 * そのため開いた直後に自動で始める（`autoStart`）。このページは押して
 * 確かめるためだけにあり、何を押すかを知らずに着地した人に、説明文を
 * 置く代わりに実物の上で示す。
 */
export function ReferenceDemoSpotlightTour() {
  const t = useTranslations("reference.demo.tour");

  const steps: readonly SpotlightStep[] = [
    {
      targetId: AGARI_SCORE_RESULT_TOUR_ID.yaku,
      title: t("yaku.title"),
      description: t("yaku.description"),
    },
    {
      targetId: AGARI_SCORE_RESULT_TOUR_ID.score,
      title: t("score.title"),
      description: t("score.description"),
    },
  ];

  return (
    <SpotlightTour steps={steps} labels={spotlightTourLabels(t)} autoStart />
  );
}
