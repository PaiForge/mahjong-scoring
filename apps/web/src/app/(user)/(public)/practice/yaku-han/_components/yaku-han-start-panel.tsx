"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DEFAULT_YAKU_HAN_RANGE } from "@mahjong-scoring/core";
import type { YakuHanRange } from "@mahjong-scoring/core";
import { PrimaryLinkButton } from "@/app/_components/primary-link-button";
import { InfinityIcon } from "@/app/_components/icons/infinity-icon";
import { SectionTitle } from "@/app/_components/section-title";
import { PRACTICE_SCROLL_HASH } from "../../_lib/scroll-anchor";

/** 出題範囲の選択肢（表示順） */
const RANGE_OPTIONS: readonly {
  readonly value: YakuHanRange;
  readonly labelKey: string;
  readonly hintKey: string;
}[] = [
  {
    value: "no-kuisagari",
    labelKey: "noKuisagari",
    hintKey: "noKuisagariHint",
  },
  { value: "kuisagari", labelKey: "kuisagari", hintKey: "kuisagariHint" },
  { value: "all", labelKey: "all", hintKey: "allHint" },
];

/**
 * 役翻数練習の開始パネル（出題範囲の選択 + 開始/トレーニング導線）
 * 役翻数開始パネル
 *
 * 出題範囲をクライアント状態で保持し、選択値を play / training への
 * `range` クエリとして付与する。チャレンジモードは開始直後にカウントダウンが
 * 始まる仕様のため、範囲選択はこの説明ページ上で行う。
 */
export function YakuHanStartPanel() {
  const tRange = useTranslations("yakuHanChallenge.range");
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");

  const [range, setRange] = useState<YakuHanRange>(DEFAULT_YAKU_HAN_RANGE);

  const playHref = `/practice/yaku-han/play?range=${range}${PRACTICE_SCROLL_HASH}`;
  const trainingHref = `/practice/yaku-han/training?range=${range}${PRACTICE_SCROLL_HASH}`;

  return (
    <div className="flex flex-col gap-6">
      {/* 出題範囲の選択 */}
      <div className="space-y-3">
        <SectionTitle>{tRange("label")}</SectionTitle>
        <div className="grid gap-2 sm:grid-cols-3">
          {RANGE_OPTIONS.map((option) => {
            const isSelected = range === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setRange(option.value)}
                aria-pressed={isSelected}
                className={`flex flex-col items-start gap-1 rounded-xl border p-4 text-left transition-colors ${
                  isSelected
                    ? "border-primary-500 bg-primary-50"
                    : "border-surface-200 bg-white hover:border-primary-300"
                }`}
              >
                <span
                  className={`text-sm font-semibold ${
                    isSelected ? "text-primary-700" : "text-surface-800"
                  }`}
                >
                  {tRange(option.labelKey)}
                </span>
                <span className="text-xs text-surface-500">
                  {tRange(option.hintKey)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 開始導線 */}
      <div className="flex flex-col gap-5">
        <div className="flex w-full flex-col items-center gap-1.5">
          <PrimaryLinkButton href={playHref} className="w-full py-3">
            {tc("startButton")}
          </PrimaryLinkButton>
          <p className="text-xs text-surface-400">{tp("modeChallengeHint")}</p>
        </div>

        <div className="flex w-full items-center gap-3 text-xs text-surface-400">
          <span className="h-px flex-1 bg-surface-200" />
          <span>{tp("orDivider")}</span>
          <span className="h-px flex-1 bg-surface-200" />
        </div>

        <div className="flex w-full flex-col items-center gap-1.5">
          <Link
            href={trainingHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-500 py-3 text-sm font-semibold text-primary-600 transition-colors hover:bg-primary-50"
          >
            <InfinityIcon className="size-4" />
            {tt("startButton")}
          </Link>
          <p className="text-xs text-surface-400">{tp("modeTrainingHint")}</p>
        </div>
      </div>
    </div>
  );
}
