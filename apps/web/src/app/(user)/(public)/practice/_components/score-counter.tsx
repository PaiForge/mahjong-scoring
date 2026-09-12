import { JudgementMark } from "./judgement-mark";

interface ScoreCounterProps {
  readonly correct: number;
  readonly incorrect: number;
  /** スクリーンリーダー向けラベル（例: "正解" / "不正解"） */
  readonly correctLabel: string;
  readonly incorrectLabel: string;
  readonly className?: string;
}

/**
 * 正解数・不正解数のカウンタ（blindfold-chess の ScoreCounter 準拠）。
 *
 * 数字とスラッシュではなく、丸いアイコンバッジ（{@link JudgementMark} の
 * badge）と数値を併置する。プレイ画面下部（フッター）に置く想定。
 */
export function ScoreCounter({
  correct,
  incorrect,
  correctLabel,
  incorrectLabel,
  className = "",
}: ScoreCounterProps) {
  return (
    <div className={`flex items-center justify-center gap-12 ${className}`}>
      <div
        className="flex items-center gap-3"
        aria-label={`${correctLabel}: ${correct}`}
      >
        <span aria-hidden>
          <JudgementMark verdict="correct" variant="badge" />
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-surface-700">
          {correct}
        </span>
      </div>
      <div
        className="flex items-center gap-3"
        aria-label={`${incorrectLabel}: ${incorrect}`}
      >
        <span aria-hidden>
          <JudgementMark verdict="incorrect" variant="badge" />
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-surface-700">
          {incorrect}
        </span>
      </div>
    </div>
  );
}
