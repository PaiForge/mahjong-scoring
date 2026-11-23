import type { BenefitGrantCategory } from "@/lib/entitlements/benefit-grant-categories";

import type { GrantDurationKey } from "./grant-durations";

/** 付与のテンプレート 1 つ。文面は辞書側に置く */
export interface GrantTemplate {
  /** 文面が前提にしている期間。押したときに期間もこれにそろえる */
  readonly duration: GrantDurationKey;
}

/**
 * 付与の種別ごとの通知のテンプレート
 * 付与テンプレート
 *
 * 付与のモーダルで種別を選ぶと、その種別にテンプレートがあれば「本人への通知」の欄に
 * 文面を入れるボタンが出る。同じ理由の付与のたびに文面を打ち直さないため。埋めるのは
 * 入力欄の初期値だけで、送る前に直せる。サーバーはテンプレートを知らず、送られた値を
 * 普通の付与と同じ規則で検証する（`grantBenefits`）。
 *
 * 文面（ボタンの名前・通知のタイトル・本文）は辞書の
 * `admin.benefitGrants.templates.<種別>.{label,title,body}` に置く。
 * 例: `admin.benefitGrants.templates.earlyAdopter.title`
 *
 * @design 種別に結び付ける
 * テンプレートは「その理由の付与で送る文面」なので、種別とは別に選ばせると
 * 種別と文面が食い違う付与（種別はモニターなのにアーリーアダプターの文面）を作れてしまう。
 * 種別 1 つにテンプレートは高々 1 つ。
 *
 * @design 期間もそろえる
 * 文面が「無期限に利用できます」と書いているのに期間が既定の 30 日のまま送られると、
 * 通知と付与が食い違う。押したときに期間もテンプレートの値にし、ボタンの下にそう添える。
 *
 * @design コードの定数で持ち、管理画面から編集しない
 * テンプレートが少ないうちは、文面の修正もコミット 1 つで済み履歴も残る。
 * DB の表と編集画面を足すのは、数が増えるかコードを触らない人が文面を直すようになってから。
 *
 * @design 本文に日付を書かない
 * 期限は期間から付与のたびに決まり、通知の一覧にも出る。テンプレートに日付を書くと
 * 付与するたびにずれていく。
 */
export const GRANT_TEMPLATES: Readonly<
  Partial<Record<BenefitGrantCategory, GrantTemplate>>
> = {
  earlyAdopter: { duration: "permanent" },
};
