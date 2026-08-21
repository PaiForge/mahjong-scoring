import type { ReactNode } from "react";

interface QuestionPromptProps {
  readonly children: ReactNode;
}

/**
 * 出題文（「符を選んでください」など回答を促す一文）
 * 出題文
 *
 * 提示部と選択肢の間に置く一行。盤面と遊び方デモの双方から使い、体裁を
 * 1 箇所で持つ。見出し的な小ラベル（「待ち」「面子」など）は
 * {@link PromptLabel} を使うこと。
 */
export function QuestionPrompt({ children }: QuestionPromptProps) {
  return (
    <p className="text-center text-sm font-medium text-surface-600">
      {children}
    </p>
  );
}
