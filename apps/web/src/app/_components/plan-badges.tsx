/** ラベルの大きさ。`sm` は文や表に添える既定、`md` は状態の主役として 1 行に置くとき */
type PlanBadgeSize = "sm" | "md";

const SIZE_CLASSES: Readonly<Record<PlanBadgeSize, string>> = {
  sm: "gap-0.5 px-2 py-0.5 text-[11px]",
  md: "gap-1 px-3 py-1 text-sm",
};

const ICON_SIZE_CLASSES: Readonly<Record<PlanBadgeSize, string>> = {
  sm: "size-2.5",
  md: "size-3.5",
};

const BASE_CLASSES =
  "inline-flex shrink-0 items-center rounded-full leading-none font-black tracking-wider uppercase";

interface ProBadgeProps {
  /** 見える表記（`practiceQuota.proBadge` / `mypagePlan.status.badge.pro` 等） */
  readonly label: string;
  /**
   * 置く地の色。金の地（Pro の帯）の上では白抜きにしないと地に溶けるため、
   * 白の地に金の印で描く
   */
  readonly onGold?: boolean;
  readonly size?: PlanBadgeSize;
}

/**
 * Pro バッジ
 *
 * Pro であること・Pro で開く機能を示す金の小さなラベル。文に添えて置く
 * 添えもので、ボタンの記号（枠・塗りの hover）は持たない。リンクの中に置くときも
 * 押せるのはリンクの方で、バッジは見た目だけ。
 *
 * ユーザー向け画面と管理画面（ユーザー一覧・詳細のプラン）で同じ部品を使い、
 * 運営が見るラベルと利用者が見るラベルの外観をそろえる。そのため
 * `app/_components/` に置く。
 *
 * 文言は呼び出し側が渡す（クライアントからもサーバーからも同じ部品を使えるようにするため）。
 */
export function ProBadge({
  label,
  onGold = false,
  size = "sm",
}: ProBadgeProps) {
  return (
    <span
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} text-surface-900 ${onGold ? "bg-white" : "bg-podium-gold"}`}
    >
      <SparkleMark
        className={`${ICON_SIZE_CLASSES[size]} ${onGold ? "text-podium-gold" : ""}`}
      />
      {label}
    </span>
  );
}

interface VipBadgeProps {
  /** 見える表記（`mypagePlan.status.badge.vip` / `admin.usersTable.planBadges.vip`） */
  readonly label: string;
  readonly size?: PlanBadgeSize;
}

/**
 * VIP バッジ
 *
 * 運営から付与された Pro（`planBadgeOf` が `"vip"` を返す状態）であることを示す
 * ラベル。VIP は別のプランではなく Pro の特典の出どころの印なので、形（丸い帯・
 * 太字・印 + 文字）は {@link ProBadge} と同じにし、色で分ける。
 *
 * 会員ランクのラベルに広く見られる「深い地 + 金の差し色」で格を出す: 地は濃い紫の
 * グラデーション、印は金の王冠、縁に金の細いリング。Pro の金の塗りと並んでも
 * 一目で別物と分かり、管理画面が付与に使ってきた紫（`special`）とも意味がそろう。
 * 黒の地は「無効・墨の選択中」と読めて格が出ないため採らない。
 *
 * 出してよいのは本人のプラン画面（マイページのプラン状況）と管理画面だけ。
 * 公開プロフィール・ランキングなど他の利用者に見える場所には置かない — 他の
 * 利用者に見せる情報を増やさないため（アプリも他の利用者の情報を出さない方針）。
 */
export function VipBadge({ label, size = "sm" }: VipBadgeProps) {
  return (
    <span
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} bg-linear-to-r from-violet-900 via-purple-700 to-violet-900 text-amber-100 ring-1 ring-amber-300/70 ring-inset`}
    >
      <CrownMark className={`${ICON_SIZE_CLASSES[size]} text-amber-300`} />
      {label}
    </span>
  );
}

/** 4 本の光のきらめき（塗り）。Pro バッジの印 */
function SparkleMark({ className }: { readonly className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2c.4 4.9 2.6 7.6 8 10-5.4 2.4-7.6 5.1-8 10-.4-4.9-2.6-7.6-8-10 5.4-2.4 7.6-5.1 8-10Z" />
    </svg>
  );
}

/** 王冠（塗り）。VIP バッジの印 */
function CrownMark({ className }: { readonly className: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M2.5 7.5 7.5 11 12 4l4.5 7 5-3.5-2 11.5h-15l-2-11.5Z" />
    </svg>
  );
}
