"use client";

import { useState } from "react";
import { PracticeStartCta } from "../../_components/practice-start-cta";
import { buildPracticeStartCtaLabels } from "../../_lib/practice-start-cta-labels";
import { useTranslations } from "next-intl";
import { DEFAULT_YAKU_HAN_RANGE } from "@mahjong-scoring/core";
import type { YakuHanRange } from "@mahjong-scoring/core";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import {
  PRACTICE_SCROLL_HASH,
  PRACTICE_SETUP_ANCHOR_ID,
} from "../../_lib/scroll-anchor";

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
      {/* 出題範囲の選択。結果ページの「設定を変更する」がここへ直接送る
          （scroll-mt はヘッダ分の逃がし） */}
      <div id={PRACTICE_SETUP_ANCHOR_ID} className="scroll-mt-20 space-y-3">
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
      <PracticeStartCta
        playHref={playHref}
        trainingHref={trainingHref}
        labels={buildPracticeStartCtaLabels({
          challenge: tc,
          practice: tp,
          training: tt,
        })}
      />
    </div>
  );
}
