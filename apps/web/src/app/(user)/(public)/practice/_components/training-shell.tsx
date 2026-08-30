"use client";

import { type ReactNode, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { Button } from "@/app/(user)/_components/button";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { useScrollToElement } from "../_hooks/use-scroll-to-element";
import { PRACTICE_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { ScoreCounter } from "./score-counter";
import {
  PracticeFooterAction,
  PracticeFooterActions,
} from "./practice-footer-actions";

interface TrainingShellProps {
  /** 画面上部に表示する練習名（PageTitle に渡す） */
  readonly title: ReactNode;
  /**
   * 練習名の右隣に並べる操作要素（ヘルプボタン等）
   *
   * 時間無制限のトレーニングだけが持つ。チャレンジでは読ませている間も
   * タイマーが進むため、同じ位置に置かない。
   */
  readonly titleAction?: ReactNode;
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
   * 「わからない」操作。指定時のみ、終了リンクの上に正解開示リンクを表示する
   * （無回答で正解を開いてから次問題へ進む練習向け）。
   */
  readonly onReveal?: () => void;
  /** 「わからない」を一時的に無効化する（フィードバック表示中・出題の生成待ちなど） */
  readonly revealDisabled?: boolean;
  /**
   * 正解開示中。「わからない」と同じ位置に「次の問題へ」を表示する
   *
   * 位置を変えないのは、連続で開示して流したいとき（引き直し用途）に
   * 同じ場所の連打で済ませるため。
   */
  readonly isRevealed?: boolean;
  /**
   * 回答後の停止中。盤面の直下に「次の問題へ」ボタンを表示する
   *
   * 開示中と違ってフッターのリンクではなくボタンで出すのは、答え合わせのあと
   * 必ず通る導線であり、回答ボタンと同じ位置で受けるため。
   */
  readonly isHolding?: boolean;
  /** 停止状態から次問題へ進む（「次の問題へ」が呼ぶ） */
  readonly onProceed?: () => void;
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
  titleAction,
  correctCount,
  totalCount,
  exitHref,
  children,
  maxWidth = "max-w-md",
  onReveal,
  revealDisabled = false,
  isRevealed = false,
  isHolding = false,
  onProceed,
}: TrainingShellProps) {
  const tc = useTranslations("challenge");
  const tt = useTranslations("training");

  // 練習開始直後、グローバルヘッダ分のオフセットを解消して盤面を画面上部へ表示する
  useScrollToElement(PRACTICE_SCROLL_ANCHOR_ID);

  // チャレンジを「やめる」で抜けたときと同じく、終了したことをトーストで返す。
  // トーストの表示自体はルートレイアウトの GlobalToaster が担うため、
  // 遷移後の説明ページでも消えずに残る。
  const handleExit = useCallback(() => {
    toast(tt("exitToast"));
  }, [tt]);

  return (
    <ContentContainer id={PRACTICE_SCROLL_ANCHOR_ID} fillViewport>
      <PageTitle action={titleAction}>{title}</PageTitle>

      <div className={`mx-auto space-y-8 ${maxWidth}`}>
        {/* Game content area */}
        <div>
          {children}

          {/* 回答後は自動で進まず、答え合わせを読み終えてから押してもらう */}
          {isHolding && onProceed && (
            <div className="mt-4">
              <Button size="lg" fullWidth onClick={onProceed}>
                {tt("nextButton")}
              </Button>
            </div>
          )}
        </div>

        {/* Footer: 正解 / 不正解 カウンタ（score/play と同じくアイコン付きで下部に表示） */}
        <ScoreCounter
          correct={correctCount}
          incorrect={totalCount - correctCount}
          correctLabel={tc("correct")}
          incorrectLabel={tc("incorrect")}
        />

        {/* Reveal / Exit: 参考プロジェクトに倣い、スコア下にまとめて縦に並べる */}
        <PracticeFooterActions>
          {onReveal &&
            (isRevealed ? (
              <PracticeFooterAction onClick={() => onProceed?.()}>
                {tt("nextButton")}
              </PracticeFooterAction>
            ) : (
              <PracticeFooterAction
                onClick={onReveal}
                disabled={revealDisabled}
              >
                {tt("revealButton")}
              </PracticeFooterAction>
            ))}
          <PracticeFooterAction href={exitHref} onClick={handleExit}>
            {tt("exitButton")}
          </PracticeFooterAction>
        </PracticeFooterActions>
      </div>
    </ContentContainer>
  );
}
