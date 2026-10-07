import { SparkleIcon } from "./icons/sparkle-icon";

interface ProBadgeProps {
  /** 見える表記（`practiceQuota.proBadge`） */
  readonly label: string;
}

/**
 * Pro バッジ
 *
 * Pro であること・Pro で開く機能を示す金の小さなラベル。文に添えて置く
 * 添えもので、押せる面の記号（太枠・影）は持たない。リンクの中に置くときも
 * 押せるのはリンクの方で、バッジは見た目だけ。
 *
 * 文言は呼び出し側が渡す（`NativeAdBadge` と同じく、クライアントからも
 * サーバーからも同じ部品を使えるようにするため）。
 */
export function ProBadge({ label }: ProBadgeProps) {
  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-pro px-2 py-0.5 text-[11px] leading-none font-black tracking-wider text-pro-foreground uppercase">
      <SparkleIcon className="size-2.5" />
      {label}
    </span>
  );
}
