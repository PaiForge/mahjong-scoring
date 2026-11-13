interface VipBadgeProps {
  /** 見える表記（`mypagePlan.status.badge.vip`） */
  readonly label: string;
}

/**
 * VIP バッジ
 *
 * 運営から付与された Pro（`planBadgeOf` が `"vip"` を返す状態）であることを示す
 * 小さなラベル。VIP は別のプランではなく Pro の特典の出どころの印なので、形は
 * `ProBadge` と同じにし、色だけを Pro の金と明確に違う墨の地・白抜きにする。
 * 文に添えて置く添えもので、ボタンの記号（枠・塗りの hover）は持たない。
 *
 * 出してよいのは本人のプラン画面（マイページのプラン状況）と管理画面だけ。
 * 公開プロフィール・ランキングなど他の利用者に見える場所には置かない — 他の
 * 利用者に見せる情報を増やさないため（アプリも他の利用者の情報を出さない方針）。
 *
 * 文言は呼び出し側が渡す（`ProBadge` と同じく、クライアントからもサーバーからも
 * 同じ部品を使えるようにするため）。
 */
export function VipBadge({ label }: VipBadgeProps) {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full bg-surface-900 px-2 py-0.5 text-[11px] leading-none font-black tracking-wider text-white uppercase">
      {label}
    </span>
  );
}
