"use client";

import { useCallback, useState } from "react";
import type { ReactNode } from "react";
import { ModalShell } from "@/app/_components/modal-shell";
import { Button } from "@/app/(user)/_components/button";
import { HelpIconButton } from "@/app/(user)/_components/help-icon-button";

/**
 * ヘルプツアーの 1 枚
 * ツアースライド
 */
export interface HelpTourSlide {
  readonly key: string;
  readonly title: string;
  readonly caption: string;
  /** スライド本体。実物のコンポーネントを描くことで UI 変更に自動追従させる */
  readonly node: ReactNode;
}

interface HelpTourLabels {
  readonly close: string;
  readonly prev: string;
  readonly next: string;
}

interface HelpTourButtonProps {
  readonly onClick: () => void;
  /** aria-label（「この練習の進め方を見る」など） */
  readonly label: string;
}

/**
 * ヘルプツアーを開く「?」ボタン
 * ツアー起動ボタン
 *
 * 見た目は共通の {@link HelpIconButton}。設定画面の PageTitle の右端にも、
 * 出題文の横にも同じものを置く。
 */
export function HelpTourButton({ onClick, label }: HelpTourButtonProps) {
  return <HelpIconButton onClick={onClick} label={label} />;
}

interface HelpTourModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly slides: readonly HelpTourSlide[];
  readonly labels: HelpTourLabels;
}

/**
 * 練習の進め方を実物のコンポーネントで見せるカルーセルモーダル
 * ヘルプツアーモーダル
 *
 * 初回利用者向けに「開始する」後の画面を数枚のスライドで先に見せる。
 * スクリーンショットではなく実物を描画するため、UI 変更に自動追従する。
 * シェル（オーバーレイ・Escape・スクロールロック・body へのポータル）は
 * ModalShell に委譲し、パネルの中身（ヘッダー・スライド・フッター）だけを持つ。
 * 開くたびに 1 枚目へ戻る。
 */
export function HelpTourModal({
  isOpen,
  onClose,
  title,
  slides,
  labels,
}: HelpTourModalProps) {
  const [index, setIndex] = useState(0);
  const total = slides.length;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const goPrev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const goNext = useCallback(
    () => setIndex((i) => Math.min(total - 1, i + 1)),
    [total],
  );
  const close = useCallback(() => {
    setIndex(0);
    onClose();
  }, [onClose]);

  const current = slides[index];

  return (
    // ヘッダー・本文・フッターの区画をパネル自身の flex で組むため、
    // 既定のパネル体裁（p-6 / space-y-6 / 太枠）は使わず丸ごと差し替える。
    <ModalShell
      isOpen={isOpen}
      onClose={close}
      label={title}
      widthClassName="max-w-lg"
      panelClassName="flex max-h-[85vh] flex-col overflow-hidden rounded-xl bg-white"
    >
      {current !== undefined && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-dashed border-border/40 px-5 py-3">
            <h3 className="text-base font-bold text-surface-900">{title}</h3>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="text-surface-400 transition-colors hover:text-surface-600"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-5 w-5"
                aria-hidden
              >
                <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
              </svg>
            </button>
          </div>

          {/* Body: 見出しは px-5、スライド本体は px-2 にして牌の使える幅を最大化する */}
          <div className="overflow-y-auto py-4">
            <div className="px-5">
              <p className="mb-1 text-sm font-bold text-surface-700">
                {current.title}
              </p>
              <p className="mb-4 text-sm text-surface-500">{current.caption}</p>
            </div>
            <div className="overflow-x-auto px-2">{current.node}</div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t-2 border-dashed border-border/40 px-5 py-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={isFirst}
              className="rounded-lg px-4 py-2 text-sm font-bold text-surface-600 transition-colors hover:bg-surface-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {labels.prev}
            </button>

            <div className="flex items-center gap-2" aria-hidden>
              {slides.map((s, i) => (
                <span
                  key={s.key}
                  className={`h-2 w-2 rounded-full transition-colors ${
                    i === index ? "bg-primary-500" : "bg-surface-300"
                  }`}
                />
              ))}
            </div>

            {isLast ? (
              <Button size="sm" onClick={close}>
                {labels.close}
              </Button>
            ) : (
              <Button size="sm" onClick={goNext}>
                {labels.next}
              </Button>
            )}
          </div>
        </>
      )}
    </ModalShell>
  );
}
