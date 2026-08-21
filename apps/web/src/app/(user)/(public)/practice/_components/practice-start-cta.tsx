import Link from "next/link";

import { InfinityIcon } from "@/app/_components/icons/infinity-icon";

import { PrimaryLinkButton } from "@/app/_components/primary-link-button";

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

/**
 * 練習の開始導線（チャレンジ / OR 区切り / トレーニング）
 * 練習開始導線
 *
 * 説明ページ・設定パネルで共通の3ブロック構成。サーバー・クライアント
 * どちらのツリーからも使えるよう、文言は props で受け取る表示専用にしている。
 */
export function PracticeStartCta({
  playHref,
  trainingHref,
  labels,
  disabled = false,
}: PracticeStartCtaProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex w-full flex-col items-center gap-1.5">
        {disabled ? (
          <span
            aria-disabled="true"
            className="block w-full cursor-not-allowed rounded-lg border-3 border-ink bg-surface-200 px-6 py-3 text-center text-sm font-bold text-surface-400 opacity-50"
          >
            {labels.challenge}
          </span>
        ) : (
          <PrimaryLinkButton href={playHref} className="w-full py-3">
            {labels.challenge}
          </PrimaryLinkButton>
        )}
        <p className="text-xs text-surface-400">{labels.challengeHint}</p>
      </div>

      <div className="flex w-full items-center gap-3 text-xs text-surface-400">
        <span className="h-0.5 flex-1 border-t-2 border-dashed border-border/40" />
        <span className="font-bold">{labels.orDivider}</span>
        <span className="h-0.5 flex-1 border-t-2 border-dashed border-border/40" />
      </div>

      <div className="flex w-full flex-col items-center gap-1.5">
        {disabled ? (
          <span
            aria-disabled="true"
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-lg border-3 border-ink py-3 text-sm font-bold text-surface-400 opacity-50"
          >
            <InfinityIcon className="size-4" />
            {labels.training}
          </span>
        ) : (
          <Link
            href={trainingHref}
            className="press-sm inline-flex w-full items-center justify-center gap-2 rounded-lg border-3 border-ink bg-card py-3 text-sm font-bold text-primary-700 shadow-sm hover:bg-primary-50"
          >
            <InfinityIcon className="size-4" />
            {labels.training}
          </Link>
        )}
        <p className="text-xs text-surface-400">{labels.trainingHint}</p>
      </div>
    </div>
  );
}
