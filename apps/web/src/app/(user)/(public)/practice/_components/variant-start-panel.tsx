"use client";

import { Suspense, useState } from "react";
import { useTranslations } from "next-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@/lib/db/practice-menu-types";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { useVariantQuery } from "../_hooks/use-variant-query";
import {
  practicePlayHref,
  practiceTrainingHref,
} from "../_lib/practice-catalog";
import { buildPracticeStartCtaLabels } from "../_lib/practice-start-cta-labels";
import {
  PRACTICE_SCROLL_HASH,
  PRACTICE_SETUP_ANCHOR_ID,
} from "../_lib/scroll-anchor";
import { PracticeStartCta } from "./practice-start-cta";
import { PracticeStartCtaSkeleton } from "./practice-start-cta-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";

interface VariantStartPanelProps {
  /** バリアントを持つ練習のスラッグ（レジストリの `variants` を列挙する） */
  readonly slug: PracticeMenuSlug;
}

/** 選択肢 1 枚の外形（実物とスケルトンで共有） */
const OPTION_FRAME_CLASS =
  "flex flex-col items-start gap-1 rounded-xl border p-4 text-left";

function VariantOptions({ slug }: VariantStartPanelProps) {
  const { namespace, variants, timeLimit, mistakeLimit } =
    practiceMenuBySlug(slug);
  const tVariants = useTranslations(`${namespace}.variants`);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");

  // 教本・結果ページから `?variant=` 付きで来たときはそれを初期選択にする
  const initial = useVariantQuery(slug);
  const [variant, setVariant] = useState<string>(initial);

  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {variants.map((option) => {
          const isSelected = variant === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setVariant(option)}
              aria-pressed={isSelected}
              className={`${OPTION_FRAME_CLASS} transition-colors ${
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
                {tVariants(`${option}.label`)}
              </span>
              <span className="text-xs text-surface-500">
                {tVariants(`${option}.hint`)}
              </span>
            </button>
          );
        })}
      </div>

      <PracticeStartCta
        playHref={`${practicePlayHref(slug, variant)}${PRACTICE_SCROLL_HASH}`}
        trainingHref={`${practiceTrainingHref(slug, variant)}${PRACTICE_SCROLL_HASH}`}
        labels={buildPracticeStartCtaLabels(
          { challenge: tc, practice: tp, training: tt },
          { timeLimit, mistakeLimit },
        )}
      />
    </>
  );
}

/** URL の読み出し前に確保する、選択肢 3 枚と開始導線の枠 */
function VariantOptionsSkeleton({ count }: { readonly count: number }) {
  return (
    <>
      <div className="grid gap-2 sm:grid-cols-3">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`${OPTION_FRAME_CLASS} border-surface-100 bg-surface-50`}
          >
            <SkeletonBar className="h-5 w-24" tone={100} />
            <SkeletonBar className="h-4 w-full" tone={100} />
          </div>
        ))}
      </div>
      <PracticeStartCtaSkeleton />
    </>
  );
}

/**
 * 出題設定（バリアント）の選択と開始導線
 * バリアント選択パネル
 *
 * バリアントを持つ練習（レジストリの `variants`）の説明ページが使う共通の
 * 設定 UI。選択肢はレジストリの列挙そのもので、ラベルと補足は
 * `<namespace>.variants.<key>.{label,hint}` から引く。チャレンジモードは
 * 開始直後にカウントダウンが始まる仕様のため、選択は説明ページ上で行い、
 * play / training への `?variant=` に載せて運ぶ。
 *
 * 初期選択は URL の `?variant=`（教本の導線・結果ページの「設定を変更する」が
 * 付ける）。`useSearchParams()` で読むため静的ルートではこのサブツリーだけが
 * クライアント描画になる — 自前の `Suspense` で包み、プリレンダー HTML には
 * 選択肢と同寸のスケルトンを出す（これが無いと `loading.tsx` の境界まで
 * 巻き込んでページ全体がスケルトンになる）。
 *
 * 見出しは練習共通の「設定」で、結果ページの「設定を変更する」がこの
 * セクションへ直接送る（`PRACTICE_SETUP_ANCHOR_ID`。scroll-mt はヘッダ分の逃がし）。
 */
export function VariantStartPanel({ slug }: VariantStartPanelProps) {
  const tp = useTranslations("practice");
  const { variants } = practiceMenuBySlug(slug);

  return (
    <div className="flex flex-col gap-6">
      <div id={PRACTICE_SETUP_ANCHOR_ID} className="scroll-mt-20 space-y-3">
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <Suspense fallback={<VariantOptionsSkeleton count={variants.length} />}>
          <VariantOptions slug={slug} />
        </Suspense>
      </div>
    </div>
  );
}
