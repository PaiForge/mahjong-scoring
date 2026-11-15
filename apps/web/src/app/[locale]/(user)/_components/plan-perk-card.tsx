import type { ReactNode } from "react";

interface PlanPerkCardProps {
  /** 丸の中に置くアイコン（`size-7` で描く） */
  readonly icon: ReactNode;
  readonly title: string;
  readonly description: string;
  /** 説明の下に置くもの（マイページでは機能へのリンク） */
  readonly children?: ReactNode;
}

/**
 * Pro の特典 1 つのカード
 * 特典カード
 *
 * 料金ページ（「Pro でできること」）とマイページの購入状況（「使える機能」）が
 * 同じ形で特典を見せる。買う前に見た絵と、買った後に見る絵を揃え、
 * どの特典の話かを見た目で結び付けるため。リスト（`<ul>`）の項目として描く。
 */
export function PlanPerkCard({
  icon,
  title,
  description,
  children,
}: PlanPerkCardProps) {
  return (
    <li className="flex items-start gap-3 rounded-panel bg-brand-subtle p-5">
      <span
        aria-hidden="true"
        className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-brand-subtle-foreground"
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="text-sm leading-relaxed">{description}</p>
        {children}
      </div>
    </li>
  );
}
