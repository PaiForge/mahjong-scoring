"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  practiceMenuBySlug,
  resolveInitialPracticeVariant,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import {
  usePracticeVariantStore,
  useRememberedPracticeVariant,
} from "@/app/_hooks/use-practice-variant-store";
import {
  practicePlayHref,
  practiceTrainingHref,
  VARIANT_PARAM,
} from "@mahjong-scoring/features/routes";
import { buildPracticeStartCtaLabels } from "@mahjong-scoring/features/practice/start-cta-labels";
import {
  PRACTICE_SCROLL_HASH,
  PRACTICE_SETUP_ANCHOR_ID,
} from "../_lib/scroll-anchor";
import { PracticeStartCta } from "./practice-start-cta";
import { PracticeStartCtaSkeleton } from "./practice-start-cta-skeleton";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  SELECTED_TILE_CLASSES,
  UNSELECTED_TILE_CLASSES,
} from "@/app/[locale]/(user)/_components/_lib/selection-classes";

interface VariantStartPanelProps {
  /** バリアントを持つ練習のスラッグ（レジストリの `variants` を列挙する） */
  readonly slug: PracticeMenuSlug;
}

/** 選択肢 1 枚の外形（実物とスケルトンで共有） */
const OPTION_FRAME_CLASS =
  "flex flex-col items-start gap-1 rounded-panel border p-4 text-left";

/**
 * 選択肢を並べるグリッド（実物とスケルトンで共有）
 * バリアント選択グリッド
 *
 * 3 つまでは 1 行に収める。4 つ以上は 2 列にする — 点数表早引きのように
 * 子・親が対になっているバリアントを 3 列に流し込むと、対の片方だけが次の行に
 * こぼれて並びが読めなくなるため。狭い画面では常に 1 列。
 */
function optionGridClass(count: number): string {
  return `grid gap-2 ${count > 3 ? "sm:grid-cols-2" : "sm:grid-cols-3"}`;
}

/**
 * 初期選択を決めてから選択肢を描く
 *
 * 教本・結果ページ・トレーニングの終了・チャレンジの中断から `?variant=`
 * 付きで来たときはそれを、無ければ前回始めたときの範囲を初期選択にする
 * （`resolveInitialPracticeVariant`）。前回の範囲は端末ローカルで、読み終える
 * まではスケルトンを出す — 既定で描いてから切り替えると選択が目の前で動く。
 */
function VariantOptions({ slug }: VariantStartPanelProps) {
  const { variants } = practiceMenuBySlug(slug);
  const searchParams = useSearchParams();
  const remembered = useRememberedPracticeVariant(slug);

  if (!remembered.ready) {
    return <VariantOptionsSkeleton count={variants.length} />;
  }
  return (
    <VariantOptionsForm
      slug={slug}
      initial={resolveInitialPracticeVariant(
        slug,
        searchParams.get(VARIANT_PARAM) ?? undefined,
        remembered.variant,
      )}
    />
  );
}

function VariantOptionsForm({
  slug,
  initial,
}: VariantStartPanelProps & { readonly initial: string }) {
  const { namespace, variants, timeLimit, mistakeLimit } =
    practiceMenuBySlug(slug);
  // 例: yakuHanChallenge.variants（完成形のキーで grep したときにここへ着地させるための例）
  const tVariants = useTranslations(`${namespace}.variants`);
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");
  const rememberVariant = usePracticeVariantStore((s) => s.rememberVariant);

  const [variant, setVariant] = useState<string>(initial);

  return (
    <>
      <div className={optionGridClass(variants.length)}>
        {variants.map((option) => {
          const isSelected = variant === option;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setVariant(option)}
              aria-pressed={isSelected}
              className={`${OPTION_FRAME_CLASS} transition-colors ${
                isSelected ? SELECTED_TILE_CLASSES : UNSELECTED_TILE_CLASSES
              }`}
            >
              <span
                className={`text-sm font-semibold ${
                  isSelected ? "text-foreground" : "text-surface-800"
                }`}
              >
                {tVariants(`${option}.label`)}
              </span>
              {/* 例: yakuHanChallenge.variants.all.hint */}
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
        // 選択肢を押しただけでは保存せず、始めたときに覚える
        onStart={() => rememberVariant(slug, variant)}
      />
    </>
  );
}

/** URL と前回の範囲を読み終える前に確保する、選択肢と開始導線の枠 */
function VariantOptionsSkeleton({ count }: { readonly count: number }) {
  return (
    <>
      <div className={optionGridClass(count)}>
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
 * 初期選択は URL の `?variant=`（教本の導線・結果ページの「設定を変更する」・
 * トレーニングの「終了する」・チャレンジの「やめる」が付ける）、無ければ前回
 * チャレンジかトレーニングを始めたときの範囲（端末ローカル）。`useSearchParams()` で読むため静的ルートではこのサブツリーだけが
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
