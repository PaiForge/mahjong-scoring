"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import {
  getRankProgress,
  type RankProgress,
} from "../_actions/get-rank-progress";

interface RankProgressSummaryProps {
  readonly rankSlug: RankSlug;
}

/**
 * 級の行程の進み具合（学ぶ / 練習する / 試験）の 1 行
 * 級の進み具合
 *
 * 道場の行程カードの進み具合と同じ数え方・同じ書式。ページは静的生成なので
 * マウント後に Server Action で取る。完了画面は記録が済んでから描かれる
 * ため、取った数にはこのレッスンの完了が入っている。取れるまでは同じ高さの
 * プレースホルダを置き、取れなかった（未認証等）ときは何も出さない。
 */
export function RankProgressSummary({ rankSlug }: RankProgressSummaryProps) {
  const t = useTranslations("ranks");
  const [progress, setProgress] = useState<RankProgress | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let cancelled = false;
    getRankProgress(rankSlug).then(
      (result) => {
        if (!cancelled) setProgress(result ?? null);
      },
      () => {
        if (!cancelled) setProgress(null);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [rankSlug]);

  if (progress === null) return null;
  if (progress === undefined) {
    return <SkeletonBar className="h-4 w-48" />;
  }

  return (
    <dl
      className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-surface-600"
      data-testid="rank-progress"
    >
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.learn")}</dt>
        <dd className="tabular-nums">
          {t("stageCount", {
            done: progress.learn.done,
            total: progress.learn.total,
          })}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.practice")}</dt>
        <dd className="tabular-nums">
          {t("stageCount", {
            done: progress.practice.done,
            total: progress.practice.total,
          })}
        </dd>
      </div>
      <div className="flex gap-1">
        <dt className="font-bold">{t("stages.exam")}</dt>
        <dd>
          {t(progress.examPassed ? "stageExamPassed" : "stageExamNotTaken")}
        </dd>
      </div>
    </dl>
  );
}
