"use client";

import { type ReactNode } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ContentContainer } from "@/app/_components/content-container";
import { PageTitle } from "@/app/_components/page-title";
import { useScrollToElement } from "../_hooks/use-scroll-to-element";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { ScoreCounter } from "./score-counter";

interface TrainingShellProps {
  /** 画面上部に表示する練習名（PageTitle に渡す） */
  readonly title: ReactNode;
  /** 正解数 */
  readonly correctCount: number;
  /** 出題数 */
  readonly totalCount: number;
  /** 「終了」リンクの遷移先（練習説明ページ等） */
  readonly exitHref: string;
  /** 練習本体のUI */
  readonly children: ReactNode;
  /** 内部ラッパーの max-w クラス（既定: "max-w-md"） */
  readonly maxWidth?: string;
  /**
   * 「スキップ」操作。指定時のみ、終了リンクの上にスキップリンクを表示する
   * （無回答で次問題へ進む練習向け）。
   */
  readonly onSkip?: () => void;
  /** スキップを一時的に無効化する（フィードバック表示中など） */
  readonly skipDisabled?: boolean;
}

/**
 * トレーニング共通シェル（ステータスバー・ContentContainer）
 *
 * チャレンジの {@link import("./challenge-shell").ChallengeShell} と異なり、
 * タイマー・ライフ・カウントダウン・結果ページ遷移を持たない。
 * 時間無制限の反復練習に用い、ユーザーは「終了」リンクで任意に離脱する。
 */
export function TrainingShell({
  title,
  correctCount,
  totalCount,
  exitHref,
  children,
  maxWidth = "max-w-md",
  onSkip,
  skipDisabled = false,
}: TrainingShellProps) {
  const tc = useTranslations("challenge");
  const tt = useTranslations("training");

  // 練習開始直後、グローバルヘッダ分のオフセットを解消して盤面を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle>{title}</PageTitle>

      <div className={`mx-auto space-y-8 ${maxWidth}`}>
        {/* Game content area */}
        <div>{children}</div>

        {/* Footer: 正解 / 不正解 カウンタ（score/play と同じくアイコン付きで下部に表示） */}
        <ScoreCounter
          correct={correctCount}
          incorrect={totalCount - correctCount}
          correctLabel={tc("correct")}
          incorrectLabel={tc("incorrect")}
        />

        {/* Skip / Exit: 参考プロジェクトに倣い、スコア下にまとめて縦に並べる */}
        <div className="space-y-2 text-center">
          {onSkip && (
            <div>
              <button
                type="button"
                onClick={onSkip}
                disabled={skipDisabled}
                className="text-sm text-surface-400 underline transition-colors hover:text-surface-600 disabled:opacity-50"
              >
                {tt("skipButton")}
              </button>
            </div>
          )}
          <div>
            <Link
              href={exitHref}
              className="text-sm text-surface-400 underline transition-colors hover:text-surface-600"
            >
              {tt("exitButton")}
            </Link>
          </div>
        </div>
      </div>
    </ContentContainer>
  );
}
