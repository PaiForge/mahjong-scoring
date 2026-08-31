import { SkeletonBar } from "@/app/_components/skeleton-bar";

import {
  PRACTICE_START_CTA_BLOCK_CLASS,
  PRACTICE_START_CTA_DIVIDER_CLASS,
  PRACTICE_START_CTA_DIVIDER_LINE_CLASS,
  PRACTICE_START_CTA_FRAME_CLASS,
} from "./practice-start-cta";

/**
 * `LinkButton size="lg"` の実寸（py-3 の 24px + text-sm の行 20px +
 * border-3 の 6px = 50px）
 * 開始ボタン高さ
 *
 * 開始ボタンの場所を確保するスケルトンはこの高さを共有する（このファイルの
 * ものと、昇級試験の受験ゲート・説明ページのスケルトン）。ボタンの寸法が
 * 変わったときに直す場所を 1 つにするため。
 */
export const START_BUTTON_HEIGHT_CLASS = "h-[50px]";

/**
 * 練習の開始導線の読み込み中スケルトン
 * 練習開始導線スケルトン
 *
 * ストアが hydrate されるまでの間、{@link PracticeStartCta} と同じ寸法の枠を
 * 確保して CLS を防ぐ。並び・間隔は CTA と同じクラス定数を共有するため、
 * 導線の構成を変えてもスケルトンだけ取り残されることがない。
 * OR 区切りの破線は文字を持たないため実物をそのまま描画する。
 */
export function PracticeStartCtaSkeleton() {
  return (
    <div className={PRACTICE_START_CTA_FRAME_CLASS}>
      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        <SkeletonBar
          radius="lg"
          className={`${START_BUTTON_HEIGHT_CLASS} w-full border-3 border-ink`}
        />
        <SkeletonBar className="h-4 w-48 max-w-full" tone={100} />
      </div>

      <div className={PRACTICE_START_CTA_DIVIDER_CLASS}>
        <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
        <SkeletonBar className="h-4 w-8" tone={100} />
        <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
      </div>

      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        <SkeletonBar
          radius="lg"
          className={`${START_BUTTON_HEIGHT_CLASS} w-full border-3 border-ink`}
        />
        <SkeletonBar className="h-4 w-48 max-w-full" tone={100} />
      </div>
    </div>
  );
}
