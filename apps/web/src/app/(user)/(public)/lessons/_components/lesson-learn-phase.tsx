"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/app/(user)/_components/button";
import { DoneMark } from "@/app/(user)/_components/done-mark";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

/**
 * レッスンの本文の段階（`learn`）
 * 本文の段階
 *
 * 本文の下のボタンは状態で替わる: 解いている途中なら「確認問題に戻る
 * （n / m 問目）」、完了済みなら控えめな解き直しのリンクと練習・試験への導線、
 * それ以外は「確認問題へ」。
 */
export function LessonLearnPhase({
  completed,
  inQuiz,
  index,
  total,
  explanation,
  related,
  footer,
  onStart,
}: {
  /** 完了済みか（取れるまでは未完了と同じ） */
  readonly completed: boolean;
  /** 確認問題を解いている途中か */
  readonly inQuiz: boolean;
  /** 解いている問題の番号（0 始まり） */
  readonly index: number;
  readonly total: number;
  readonly explanation: ReactNode;
  readonly related?: ReactNode;
  readonly footer?: ReactNode;
  /** 確認問題へ（途中なら続きから、完了済みなら最初から） */
  readonly onStart: () => void;
}) {
  const t = useTranslations("lessons");
  return (
    <div className="relative space-y-8">
      {/* 完了済みの印はカードの右上（本文の最初の見出しの行の右端）。
          見出しの「?」とは場所を分ける。確認問題の画面には頭に進み具合の
          ステップが、完了画面には達成の表示があるので本文の画面だけ */}
      {completed && (
        <div className="absolute right-0 top-1.5">
          <DoneMark label={t("completedMark")} />
        </div>
      )}
      {explanation}
      {inQuiz ? (
        <Button size="lg" fullWidth onClick={onStart}>
          {t("resumeQuiz", { index: index + 1, total })}
        </Button>
      ) : completed ? (
        <>
          {/* 完了済みの人に確認問題を主導線として勧めない。解き直しは
              移動と同じ控えめなリンクにして、練習・試験へ送る */}
          <div className="text-center">
            <button
              type="button"
              onClick={onStart}
              className={`text-sm ${TEXT_LINK_CLASSES}`}
            >
              {t("retakeQuiz")}
            </button>
          </div>
          {related}
        </>
      ) : (
        <Button size="lg" fullWidth onClick={onStart}>
          {t("startQuiz", { count: total })}
        </Button>
      )}
      {footer}
    </div>
  );
}
