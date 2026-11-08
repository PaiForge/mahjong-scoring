import type { ReactNode } from "react";

interface QuestionPromptProps {
  readonly children: ReactNode;
  /**
   * 出題文の代わりに同じ行へ出す内容（トレーニングの正解表示など）
   *
   * 指定すると出題文を描かず、これを描く。行の高さは出題文と同じに保つので、
   * 差し替えても下の回答欄が動かない。
   */
  readonly replacement?: ReactNode;
}

/**
 * 出題文（「符を選んでください」など回答を促す一文）
 * 出題文
 *
 * 提示部と選択肢の間に置く一行。盤面と遊び方デモの双方から使い、体裁を
 * 1 箇所で持つ。見出し的な小ラベル（「待ち」「面子」など）は
 * {@link PromptLabel} を使うこと。
 *
 * 回答すると意味を失う行でもある（回答欄は閉じている）。トレーニングで
 * 正解を示すときは行を足さず、`replacement` でこの行を正解に差し替える
 * （{@link import("./revealed-score-answer").RevealedScoreAnswer} 参照）。
 * 行を足すと、直前まで触っていた回答欄がそのぶん押し下げられるため。
 */
export function QuestionPrompt({ children, replacement }: QuestionPromptProps) {
  return (
    <div className="min-h-5">
      {replacement ?? (
        <p className="text-center text-sm font-medium text-surface-600">
          {children}
        </p>
      )}
    </div>
  );
}
