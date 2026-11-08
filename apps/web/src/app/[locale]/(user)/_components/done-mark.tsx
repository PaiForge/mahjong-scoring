import { CheckIcon } from "./icons/check-icon";

interface DoneMarkProps {
  /**
   * 読み上げの名前（「完了」「挑戦済み」等）。印は文字を持たない。
   * 省略すると装飾として読み上げから外す（隣の文字が済んだことを言うとき）
   */
  readonly label?: string;
  /** md は行の末尾に添える既定の大きさ。sm は 1 行の文字に並べる大きさ */
  readonly size?: "sm" | "md";
}

const SIZE_CLASSES = {
  sm: { circle: "size-4", check: "size-2.5" },
  md: { circle: "size-6", check: "size-3.5" },
} as const;

/**
 * 済みの印 — 正解・完了の緑の丸に白抜きのチェック
 * 済みマーク
 *
 * 道場の行程（レッスンの完了・練習の挑戦）とレッスンの見出しで、同じ
 * 「済んだ」を同じ形で示す。教本の目次の読了チェックとも同じ見た目。
 * 級の進み具合のステップ表示も、済んだ段の値に小さい版を添える。
 */
export function DoneMark({ label, size = "md" }: DoneMarkProps) {
  const classes = SIZE_CLASSES[size];
  return (
    <span
      role={label === undefined ? undefined : "img"}
      aria-label={label}
      aria-hidden={label === undefined ? true : undefined}
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-success text-success-foreground ${classes.circle}`}
    >
      <CheckIcon className={classes.check} />
    </span>
  );
}
