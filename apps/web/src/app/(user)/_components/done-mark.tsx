import { CheckIcon } from "./icons/check-icon";

interface DoneMarkProps {
  /** 読み上げの名前（「完了」「挑戦済み」等）。印は文字を持たない */
  readonly label: string;
}

/**
 * 済みの印 — 緑の丸に白抜きのチェック
 * 済みマーク
 *
 * 道場の行程（レッスンの完了・練習の挑戦）とレッスンの見出しで、同じ
 * 「済んだ」を同じ形で示す。教本の目次の読了チェックとも同じ見た目。
 */
export function DoneMark({ label }: DoneMarkProps) {
  return (
    <span
      role="img"
      aria-label={label}
      className="inline-flex size-6 items-center justify-center rounded-full bg-primary-500 text-white"
    >
      <CheckIcon className="size-3.5" />
    </span>
  );
}
