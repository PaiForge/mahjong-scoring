interface LessonQuizStepsProps {
  /** 今解いている問題（0 始まり） */
  readonly current: number;
  readonly total: number;
  /** 並び全体の名前（「2 / 5 問目」）。読み上げで今どこかを先に伝える */
  readonly label: string;
}

/**
 * 確認問題の進み具合を 1 → 2 → 3 … の丸と線で示すステップ表示
 * 確認問題ステップ
 *
 * 確認問題の画面の頭に、見出し（「確認問題」）の代わりに置く。本文と
 * 入れ替わって出る画面で、見出しが無くても選択肢と出題文で確認問題だと
 * 分かる。残りが何問かは数字の「n / m 問目」より並びのほうが一目で読める。
 *
 * 済んだ問題は緑の塗り（`success` — 完了の記号）、今の問題は淡緑の面に
 * 緑のリング（`brand-subtle`）、まだの問題は灰の枠。ナビの現在地のような
 * 墨（`selected`）にしないのは、ここが「どこにいるか」より「どこまで
 * 済んだか」を見せる場所で、済みの印と同じ緑で積み上がるほうが進んだ
 * 手応えになるため。主操作の `action` は使わない（丸は押せない）。
 * 済んだ問題を正誤で塗り分けない。レッスンは間違えても解説を読んで進むもので、
 * 途中で正答数を意識させない（正答数は完了画面で添えるだけ）。
 */
export function LessonQuizSteps({
  current,
  total,
  label,
}: LessonQuizStepsProps) {
  const steps = Array.from({ length: total }, (_, i) => i);
  return (
    <ol
      aria-label={label}
      className="flex items-center"
      data-testid="lesson-quiz-steps"
    >
      {steps.map((step) => {
        const isDone = step < current;
        const isCurrent = step === current;
        const circleClass = isDone
          ? "border-success bg-success text-success-foreground"
          : isCurrent
            ? "border-success bg-brand-subtle text-success-strong ring-1 ring-inset ring-success"
            : "border-surface-300 bg-white text-surface-400";
        return (
          <li
            key={step}
            aria-current={isCurrent ? "step" : undefined}
            className={`flex items-center ${step === 0 ? "" : "flex-1"}`}
          >
            {step > 0 && (
              // 前の丸からこの丸へ伸びる線。ここまで来ていれば緑
              <span
                aria-hidden
                className={`h-px flex-1 ${step <= current ? "bg-success" : "bg-surface-300"}`}
              />
            )}
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold tabular-nums ${circleClass}`}
            >
              {step + 1}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
