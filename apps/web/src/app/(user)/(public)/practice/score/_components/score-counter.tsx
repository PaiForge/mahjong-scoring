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
 * 数字とスラッシュではなく、丸いアイコンバッジ（✓ / ✗）と数値を併置する。
 * プレイ画面下部（フッター）に置く想定。
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
      <div className="flex items-center gap-3" aria-label={`${correctLabel}: ${correct}`}>
        <span className="rounded-full bg-green-100 p-2 text-green-700" aria-hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-surface-700">
          {correct}
        </span>
      </div>
      <div className="flex items-center gap-3" aria-label={`${incorrectLabel}: ${incorrect}`}>
        <span className="rounded-full bg-red-100 p-2 text-red-700" aria-hidden>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            className="h-4 w-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        </span>
        <span className="font-mono text-xl font-bold tabular-nums text-surface-700">
          {incorrect}
        </span>
      </div>
    </div>
  );
}
