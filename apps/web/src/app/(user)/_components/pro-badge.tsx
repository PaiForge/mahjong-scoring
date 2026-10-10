import { SparkleIcon } from "./icons/sparkle-icon";

interface ProBadgeProps {
  /** 見える表記（`practiceQuota.proBadge`） */
  readonly label: string;
  /**
   * 置く地の色。金の地（Pro の帯）の上では白抜きにしないと地に溶けるため、
   * 白の地に金の印で描く
   */
  readonly onGold?: boolean;
}

/**
 * Pro バッジ
 *
 * Pro であること・Pro で開く機能を示す金の小さなラベル。文に添えて置く
 * 添えもので、ボタンの記号（枠・塗りの hover）は持たない。リンクの中に置くときも
 * 押せるのはリンクの方で、バッジは見た目だけ。
 *
 * 文言は呼び出し側が渡す（`NativeAdBadge` と同じく、クライアントからも
 * サーバーからも同じ部品を使えるようにするため）。
 */
export function ProBadge({ label, onGold = false }: ProBadgeProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] leading-none font-black tracking-wider text-surface-900 uppercase ${onGold ? "bg-white" : "bg-podium-gold"}`}
    >
      <SparkleIcon className={`size-2.5 ${onGold ? "text-podium-gold" : ""}`} />
      {label}
    </span>
  );
}
