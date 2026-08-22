import type { ReactNode } from "react";

import { CheckIcon } from "@/app/(user)/_components/icons/check-icon";

/**
 * 正誤の配色
 *
 * Tailwind はリテラルなクラス名しか検出しないため、条件式で組み立てない。
 * 文字色は中身（牌かテキストか）によって変わるため呼び出し側の className に委ねる。
 */
const STATE_CLASS = {
  correct: "border-success bg-success-subtle",
  incorrect: "border-ink bg-white opacity-60",
} as const;

interface DemoChoiceCellProps {
  /** この選択肢が正解か（正解のみ緑で強調しチェックを付ける） */
  readonly isCorrect: boolean;
  /** 右上のチェックバッジを出すか（既定 true） */
  readonly showCheck?: boolean;
  /** レイアウト・文字色などの追加クラス */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * 遊び方デモの選択肢セル
 * デモ選択肢セル
 *
 * 各練習の「遊び方」で正解をハイライトして見せるための枠。
 * 正誤の配色とチェックバッジの体裁をここに集約する。
 */
export function DemoChoiceCell({
  isCorrect,
  showCheck = true,
  className = "",
  children,
}: DemoChoiceCellProps) {
  const state = isCorrect ? STATE_CLASS.correct : STATE_CLASS.incorrect;

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl border-3 p-4 ${state} ${className}`}
    >
      {isCorrect && showCheck && (
        <span className="absolute right-2 top-2 flex size-5 items-center justify-center rounded-full border-2 border-ink bg-success">
          <CheckIcon className="size-3 text-white" />
        </span>
      )}
      {children}
    </div>
  );
}
