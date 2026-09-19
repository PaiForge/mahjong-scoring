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
 * 数値の桁を先に確保する幅
 *
 * `tabular-nums` は 1 桁ぶんの幅を揃えるだけで、桁数が増えたぶんは吸収
 * しない。行は `justify-center` なので、9 → 10 で数値が 1 桁伸びると
 * 両側のグループが左右へずれる（実測で片側およそ 6px）。1 問ごとに目を
 * 戻す場所なので、3 桁ぶんを先に取って動かないようにする。数字は左端に
 * 置き、余りは右へ流す（バッジと数値の間隔は `gap-3` のまま一定になる）。
 */
const COUNT_WIDTH_CLASS = "min-w-[3ch] text-left";

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
        <span
          className={`font-mono text-xl font-bold tabular-nums text-surface-700 ${COUNT_WIDTH_CLASS}`}
        >
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
        <span
          className={`font-mono text-xl font-bold tabular-nums text-surface-700 ${COUNT_WIDTH_CLASS}`}
        >
          {incorrect}
        </span>
      </div>
    </div>
  );
}
