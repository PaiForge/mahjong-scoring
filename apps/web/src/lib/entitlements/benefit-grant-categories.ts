/**
 * 特典の手動付与の種別
 * 付与種別
 *
 * 「なぜ付与したか」を集計・絞り込みできる形で持つ（`benefit_grants.category`）。
 * 自由記述の `reason` は補足のメモとして残り、種別はそれを置き換えない。
 *
 * キーは DB の値・フォームの値・URL の `?category=`・辞書キー
 * （`admin.benefitGrants.categories.<key>`。例: `admin.benefitGrants.categories.earlyAdopter`）
 * で同じ文字列を使う。変換の表を持たない。
 *
 * @design 種別は付与の属性で、利用者の属性（タグ）ではない
 * 「アーリーアダプターだから」「知り合いだから」は、その付与が行われた理由。
 * 採らなかった案: 利用者にタグを持たせ、付与したときに理由に応じたタグを自動で付ける —
 * 付与の期限切れ・取り消しのあともタグが残り、「付与の種別」と「タグ」のどちらが正かを
 * 毎回考えることになる（`is_vip` のフラグ列を退けたのと同じ理由。
 * `packages/features/src/billing/plan-badge.ts`）。付与と無関係に利用者を分類する
 * 要求が出たら、タグは別の機能として足し、付与からは同期しない。
 *
 * @design 利用者には出さない
 * 利用者に見えるラベルは種別に依らず VIP の 1 つ（`planBadgeOf`）。種別は運営の
 * 内部の分類で、マイページ・アプリ向け API・通知には載せない。
 *
 * @design 値を消さない・意味を変えない
 * 過去の行が値を持つ。使わなくなった種別はフォームの選択肢から外すだけにして、
 * この配列と辞書には残す（一覧で名前を出せるように）。
 */
export const BENEFIT_GRANT_CATEGORIES = [
  "earlyAdopter",
  "acquaintance",
  "monitor",
  "campaign",
  "compensation",
  "other",
] as const;

export type BenefitGrantCategory = (typeof BENEFIT_GRANT_CATEGORIES)[number];

const categorySet: ReadonlySet<string> = new Set(BENEFIT_GRANT_CATEGORIES);

/**
 * 文字列が付与の種別か。Server Action がクライアントの入力を絞るのと、
 * DB から読んだ値（種別の列ができる前の行は NULL）を辞書キーにする前の確認に使う
 */
export function isBenefitGrantCategory(
  value: string | null | undefined,
): value is BenefitGrantCategory {
  return typeof value === "string" && categorySet.has(value);
}
