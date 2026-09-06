import type { ReactNode } from "react";

import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { InfinityIcon } from "@/app/(user)/_components/icons/infinity-icon";
import { PlayIcon } from "@/app/(user)/_components/icons/play-icon";
import { LinkButton } from "@/app/(user)/_components/link-button";

/** 開始導線に表示する文言 */
export interface PracticeStartCtaLabels {
  /** チャレンジ開始ボタン（challenge.startButton） */
  readonly challenge: string;
  /** チャレンジの補足（practice.modeChallengeHint） */
  readonly challengeHint: string;
  /** トレーニング開始ボタン（training.startButton） */
  readonly training: string;
  /** トレーニングの補足（practice.modeTrainingHint） */
  readonly trainingHint: string;
  /** 2つの導線の区切り（practice.orDivider） */
  readonly orDivider: string;
}

interface PracticeStartCtaProps {
  /** チャレンジ開始のリンク先 */
  readonly playHref: string;
  /** トレーニング開始のリンク先 */
  readonly trainingHref: string;
  readonly labels: PracticeStartCtaLabels;
  /**
   * 出題条件が空などで開始できない状態
   *
   * リンクの代わりに無効表示のラベルを出す（遷移させない）。
   */
  readonly disabled?: boolean;
}

/** 3ブロック全体の縦積み */
export const PRACTICE_START_CTA_FRAME_CLASS = "flex flex-col gap-5";

/** ボタン + 補足文の 1 ブロック */
export const PRACTICE_START_CTA_BLOCK_CLASS =
  "flex w-full flex-col items-center gap-1.5";

/** ボタン下の補足文 */
export const PRACTICE_START_CTA_HINT_CLASS = "text-xs text-surface-400";

/** OR 区切りの行 */
export const PRACTICE_START_CTA_DIVIDER_CLASS =
  "flex w-full items-center gap-3 text-xs text-surface-400";

/** OR 区切りの破線 */
export const PRACTICE_START_CTA_DIVIDER_LINE_CLASS =
  "h-0.5 flex-1 border-t-2 border-dashed border-border/40";

/**
 * 2 つの開始導線を分ける OR 区切りの行
 * 開始導線区切り
 *
 * 練習（チャレンジ / トレーニング）と昇級試験（本番 / 模試）の開始導線、
 * およびそのスケルトンが共有する。破線は文字を持たないため、スケルトンでも
 * 実物をそのまま描く。
 *
 * @param label - 区切りの文言（`practice.orDivider`）。省略時はスケルトン用に
 *   文言の場所を空ける
 */
export function PracticeStartCtaDivider({
  label,
}: {
  readonly label?: ReactNode;
}) {
  return (
    <div className={PRACTICE_START_CTA_DIVIDER_CLASS}>
      <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
      {label === undefined ? (
        <SkeletonBar className="h-4 w-8" tone={100} />
      ) : (
        <span className="font-bold">{label}</span>
      )}
      <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
    </div>
  );
}

/**
 * トレーニング側の開始導線（白地のボタン + 補足文）
 * トレーニング開始導線
 *
 * 練習のトレーニングと昇級試験の模試で同じ姿。緑（記録に挑戦する面）と
 * 対にする白地の secondary で、無限のアイコンが時間無制限を示す。
 */
export function TrainingStartBlock({
  href,
  label,
  hint,
  disabled = false,
}: {
  readonly href: string;
  readonly label: ReactNode;
  readonly hint: ReactNode;
  readonly disabled?: boolean;
}) {
  return (
    <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
      <LinkButton
        href={href}
        variant="secondary"
        size="lg"
        fullWidth
        disabled={disabled}
      >
        <InfinityIcon className="size-4" />
        {label}
      </LinkButton>
      <p className={PRACTICE_START_CTA_HINT_CLASS}>{hint}</p>
    </div>
  );
}

/**
 * 練習の開始導線（チャレンジ / OR 区切り / トレーニング）
 * 練習開始導線
 *
 * 説明ページ・設定パネルで共通の3ブロック構成。サーバー・クライアント
 * どちらのツリーからも使えるよう、文言は props で受け取る表示専用にしている。
 * 昇級試験の説明ページは同じ骨格で本番 / 模試を並べる
 * （{@link import("../../exam/_components/exam-start-cta").ExamStartCta}）。
 */
export function PracticeStartCta({
  playHref,
  trainingHref,
  labels,
  disabled = false,
}: PracticeStartCtaProps) {
  return (
    <div className={PRACTICE_START_CTA_FRAME_CLASS}>
      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        <LinkButton href={playHref} size="lg" fullWidth disabled={disabled}>
          <PlayIcon className="size-4" />
          {labels.challenge}
        </LinkButton>
        <p className={PRACTICE_START_CTA_HINT_CLASS}>{labels.challengeHint}</p>
      </div>

      <PracticeStartCtaDivider label={labels.orDivider} />

      <TrainingStartBlock
        href={trainingHref}
        label={labels.training}
        hint={labels.trainingHint}
        disabled={disabled}
      />
    </div>
  );
}
