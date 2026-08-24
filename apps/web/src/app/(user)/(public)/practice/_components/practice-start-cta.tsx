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
    <div className={PRACTICE_START_CTA_FRAME_CLASS}>
      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        <LinkButton href={playHref} size="lg" fullWidth disabled={disabled}>
          <PlayIcon className="size-4" />
          {labels.challenge}
        </LinkButton>
        <p className={PRACTICE_START_CTA_HINT_CLASS}>{labels.challengeHint}</p>
      </div>

      <div className={PRACTICE_START_CTA_DIVIDER_CLASS}>
        <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
        <span className="font-bold">{labels.orDivider}</span>
        <span className={PRACTICE_START_CTA_DIVIDER_LINE_CLASS} />
      </div>

      <div className={PRACTICE_START_CTA_BLOCK_CLASS}>
        <LinkButton
          href={trainingHref}
          variant="secondary"
          size="lg"
          fullWidth
          disabled={disabled}
        >
          <InfinityIcon className="size-4" />
          {labels.training}
        </LinkButton>
        <p className={PRACTICE_START_CTA_HINT_CLASS}>{labels.trainingHint}</p>
      </div>
    </div>
  );
}
