import type { ReactNode } from "react";

interface DemoChoiceCellProps {
  /** レイアウト・文字サイズなどの追加クラス */
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * 遊び方デモの選択肢セル
 * デモ選択肢セル
 *
 * 各練習の「問題方式」で、出題時（未回答）の選択肢を静的に描く枠。
 * 盤面の選択肢ボタン（{@link import("./choice-button").ChoiceButton}）の
 * 未選択時と同じ体裁にする。押せる要素ではないため button ではなく div で、
 * hover の演出も持たない。
 *
 * 正解のハイライトは出さない。このセクションが見せるのは「どのような問題が
 * 出るか」であって、答え合わせの画面ではないため。
 */
export function DemoChoiceCell({
  className = "",
  children,
}: DemoChoiceCellProps) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl border-3 border-ink bg-white p-4 ${className}`}
    >
      {children}
    </div>
  );
}
