import type { BenefitGrantCategory } from "@/lib/entitlements/benefit-grant-categories";

import type { GrantDurationKey } from "./grant-durations";

/**
 * 特典の付与のテンプレート
 * 付与テンプレート
 *
 * 付与のモーダルで選ぶと、種別・期間・通知のタイトルと本文をまとめて埋める。
 * 同じ理由の付与を繰り返すたびに文面を打ち直さないため。埋めるのは入力欄の初期値だけで、
 * 送る前に手で直せる。サーバーはテンプレートを知らず、送られた値を普通の付与と同じ規則で
 * 検証する（`grantBenefits`）。
 *
 * 文面（一覧に出す名前・通知のタイトル・本文）は辞書の
 * `admin.benefitGrants.templates.<key>.{label,title,body}` に置く。
 * 例: `admin.benefitGrants.templates.earlyAdopter.title`
 *
 * @design コードの定数で持ち、管理画面から編集しない
 * テンプレートが少ないうちは、文面の修正もコミット 1 つで済み履歴も残る。
 * DB の表と編集画面を足すのは、数が増えるかコードを触らない人が文面を直すようになってから。
 *
 * @design 本文に日付を書かない
 * 期限は期間から付与のたびに決まり、通知の一覧にも出る。テンプレートに日付を書くと
 * 付与するたびにずれていく。
 */
export const GRANT_TEMPLATES = [
  { key: "earlyAdopter", category: "earlyAdopter", duration: "permanent" },
] as const satisfies readonly {
  readonly key: string;
  readonly category: BenefitGrantCategory;
  readonly duration: GrantDurationKey;
}[];

export type GrantTemplate = (typeof GRANT_TEMPLATES)[number];
