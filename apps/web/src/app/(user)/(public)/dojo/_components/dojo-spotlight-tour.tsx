"use client";

import { useTranslations } from "next-intl";

import {
  SpotlightTour,
  type SpotlightStep,
} from "@/app/(user)/_components/spotlight-tour";

import { DOJO_TOUR_ID } from "../_lib/tour-ids";

/**
 * 道場の見方のヘルプツアー
 * 道場スポットライトツアー
 *
 * ページ見出しの横の「?」を押すと、段級位と黒帯への道の読み方を、該当する
 * 要素を順に照らして説明する。この説明は以前は見出しと最初の節の間の
 * 地の文だったが、他のページは「見出し → 節の見出し → 本文」で始まるため
 * そこに置くと型が崩れる。常に読ませる必要のある内容でもない（カード自体に
 * 状態・進み具合・施錠の注記が出ている）ので、知りたい人が開く形にした。
 *
 * 次の目標の級が無い（全級取得済み）人には見出し行・進み具合が、
 * 未取得の上位級が無い人には施錠の注記が描かれないので、その段階は
 * ツアーが飛ばす。
 */
export function DojoSpotlightTour() {
  const t = useTranslations("dojo.tour");

  const steps: readonly SpotlightStep[] = [
    {
      targetId: DOJO_TOUR_ID.currentRank,
      title: t("currentRank.title"),
      description: t("currentRank.description"),
    },
    {
      targetId: DOJO_TOUR_ID.nextRankHeader,
      title: t("nextRank.title"),
      description: t("nextRank.description"),
    },
    {
      targetId: DOJO_TOUR_ID.nextRankStages,
      title: t("stages.title"),
      description: t("stages.description"),
    },
    {
      targetId: DOJO_TOUR_ID.lockedNote,
      title: t("locked.title"),
      description: t("locked.description"),
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
