"use client";

import { useState, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import { InfoModal } from "@/app/(user)/_components/info-modal";
import { QuestionMarkCircleIcon } from "@/app/(user)/_components/icons/question-mark-circle-icon";

interface PracticeHelpButtonProps {
  /** モーダルの見出し */
  readonly title: string;
  /** ボタンの読み上げ名（何のヘルプかを含めること） */
  readonly label: string;
  /** モーダルの本文 */
  readonly children: ReactNode;
}

/**
 * 練習画面のヘルプボタン
 * 練習ヘルプボタン
 *
 * PageTitle の右隣（action スロット）に置く「?」ボタンと、その中身の
 * {@link InfoModal} を1つにまとめたもの。出題のルールのうち、盤面を見ても
 * 読み取れないもの（何を符に数え、何を数えないか）を置く場所。
 *
 * 制限時間のあるチャレンジでは使わない。モーダルを開いている間もタイマーは
 * 止まらず、読ませるほど不利になるため。
 */
export function PracticeHelpButton({
  title,
  label,
  children,
}: PracticeHelpButtonProps) {
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={label}
        className="text-surface-400 transition-colors hover:text-surface-600"
      >
        <QuestionMarkCircleIcon />
      </button>

      <InfoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={title}
        closeLabel={tCommon("close")}
      >
        {children}
      </InfoModal>
    </>
  );
}
