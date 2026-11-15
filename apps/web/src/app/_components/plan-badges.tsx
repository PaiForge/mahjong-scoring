import type { PlanBadge as PlanBadgeKind } from "@mahjong-scoring/features/billing/plan-badge";

/** ラベルの大きさ。`sm` は文や表に添える既定、`md` は状態の主役として 1 行に置くとき */
type PlanBadgeSize = "sm" | "md";

const SIZE_CLASSES: Readonly<Record<PlanBadgeSize, string>> = {
  sm: "gap-0.5 px-2 py-0.5 text-[11px]",
  md: "gap-1 px-3 py-1 text-sm",
};

const MARK_SIZE_CLASSES: Readonly<Record<PlanBadgeSize, string>> = {
  sm: "size-2.5",
  md: "size-3.5",
};

const BASE_CLASSES =
  "inline-flex shrink-0 items-center rounded-full leading-none font-black tracking-wider uppercase ring-1 ring-inset";

/** ラベルの種類ごとの外観 */
interface BadgeLook {
  /** 地・文字・縁の色 */
  readonly surface: string;
  /** 印（左の図形）の色 */
  readonly mark: string;
  /** 印の図形（24x24 の塗りの path） */
  readonly path: string;
}

/**
 * 種類ごとの外観
 *
 * 形（丸い帯・太字・印 + 文字・縁の細いリング・地のグラデーション）は共通で、
 * 色と印だけを変える。VIP は Pro の特典の出どころの印で別のプランではないため、
 * 同じ形で「格」だけを違えて見せる。
 *
 * - `pro` — 金の地にきらめき。Pro の機能の印として練習の画面にも出る
 * - `vip` — 会員ランクのラベルに広く見られる「深い地 + 金の差し色」。濃い紫の地に
 *   金の王冠と金の縁。金一色の Pro と並んでも一目で別物と分かる。黒の地は
 *   「無効・墨の選択中」と読めて格が出ないため採らない
 */
const BADGE_LOOKS: Readonly<Record<PlanBadgeKind, BadgeLook>> = {
  pro: {
    surface:
      "bg-linear-to-r from-amber-300 via-podium-gold to-amber-300 text-surface-900 ring-amber-600/40",
    mark: "text-surface-900",
    path: "M12 2c.4 4.9 2.6 7.6 8 10-5.4 2.4-7.6 5.1-8 10-.4-4.9-2.6-7.6-8-10 5.4-2.4 7.6-5.1 8-10Z",
  },
  vip: {
    surface:
      "bg-linear-to-r from-violet-900 via-purple-700 to-violet-900 text-amber-100 ring-amber-300/70",
    mark: "text-amber-300",
    path: "M2.5 7.5 7.5 11 12 4l4.5 7 5-3.5-2 11.5h-15l-2-11.5Z",
  },
};

/** 金の地（Pro の帯）の上に置くときの外観。地に溶けないよう白の地にする */
const ON_GOLD_SURFACE = "bg-white text-surface-900 ring-transparent";

interface PlanBadgeProps {
  /** ラベルの種類（`planBadgeOf` の戻り値。Pro の機能の印なら `"pro"`） */
  readonly badge: PlanBadgeKind;
  /** 見える表記（`mypagePlan.status.badge.*` / `admin.usersTable.planBadges.*` 等） */
  readonly label: string;
  readonly size?: PlanBadgeSize;
  /**
   * 金の地（Pro の帯）の上に置く。白の地に、印だけ種類の色で描く
   */
  readonly onGold?: boolean;
}

/**
 * Pro / VIP のラベル
 * プランバッジ
 *
 * Pro であること（購入 = Pro / 運営からの付与 = VIP）や Pro で開く機能を示す
 * 小さなラベル。文に添えて置く添えもので、ボタンの記号（枠・塗りの hover）は
 * 持たない。リンクの中に置くときも押せるのはリンクの方で、ラベルは見た目だけ。
 *
 * ユーザー向け画面と管理画面（ユーザー一覧・詳細のプラン）で同じ部品を使い、
 * 運営が見るラベルと利用者が見るラベルの外観をそろえる。そのため
 * `app/_components/` に置く。呼び出し側は種類で部品を書き分けず、`badge` を渡す。
 *
 * VIP を出してよいのは本人のプラン画面（マイページのプラン状況）と管理画面だけ。
 * 公開プロフィール・ランキングなど他の利用者に見える場所には置かない — 他の
 * 利用者に見せる情報を増やさないため（アプリも他の利用者の情報を出さない方針）。
 *
 * 文言は呼び出し側が渡す（クライアントからもサーバーからも同じ部品を使えるようにするため）。
 */
export function PlanBadge({
  badge,
  label,
  size = "sm",
  onGold = false,
}: PlanBadgeProps) {
  const look = BADGE_LOOKS[badge];
  return (
    <span
      className={`${BASE_CLASSES} ${SIZE_CLASSES[size]} ${onGold ? ON_GOLD_SURFACE : look.surface}`}
    >
      <svg
        className={`${MARK_SIZE_CLASSES[size]} ${onGold ? "text-podium-gold" : look.mark}`}
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        <path d={look.path} />
      </svg>
      {label}
    </span>
  );
}
