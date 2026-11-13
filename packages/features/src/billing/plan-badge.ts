/**
 * プランの出どころを示すラベル
 * プランバッジ
 *
 * - `pro` — 自分で購入した Pro（買い切り・30 日パス）
 * - `vip` — 運営から付与された Pro（`benefit_grants` の有効な行）
 *
 * VIP は別のプランではなく、Pro の特典の出どころの印。特典の中身（`has-benefit.ts`）は
 * 購入でも付与でも同じで、ラベルだけが分かれる。
 *
 * @design フラグ列を持たない
 * 付与かどうかはスキーマに保存せず、`benefit_grants` の有効な行から毎回導く。
 * 採らなかった案:
 * - `profiles` に `is_vip` のようなフラグ列を足す — 付与の期限切れ・取り消しで
 *   フラグが嘘になり、特典の判定規則（`has-benefit.ts`）と二重管理になる
 * - 付与を `purchases` に `provider = 'admin'` の行として入れる — 新規購入の可否
 *   （付与だけの人は購入できる）・金額・返金の規則がすべて購入を前提にしており、
 *   付与を混ぜると全部に例外が要る
 * - 監査ログ（`moderation_actions`）から導く — 監査は「誰が何をしたか」の記録で、
 *   現在の状態の正本ではない
 *
 * @design 重なったときはプラン状況の規則に従う
 * ラベルはプラン状況（web の `planStatusOf` が導く `PlanStatus`、アプリ向け API の
 * `MobilePlanStatus`）の `kind` だけから導く。購入と付与が重なる人の扱いは
 * `planStatusOf` の既存の規則（買い切りが最優先、次に無期限の付与、あとは後に切れる方）に
 * そのまま従うので、見出しの文言とラベルが同じ 1 つの状態を指す。Pro と VIP を
 * 両方出す案は採らない — 見出しが 1 つの状態なのにラベルが 2 つになる。
 * 画面ごとに `kind === "granted"` を書かず、この関数を通す（web・管理画面・アプリで
 * 対応がずれないように）。
 *
 * @design 付与の種別では分けない
 * `benefit_grants` に付与の種別（VIP / 補償 / キャンペーン等）の列は持たず、有効な付与は
 * すべて VIP とする。「運営から付与されたなら VIP」という要求に対して種別は要らない。
 * 種別で外観を分ける要求が出たら、その時に NULL 可の列を足せば足り、既存行の移行も要らない。
 *
 * このモジュールは純粋（React・DB に触れない）。
 */
export type PlanBadge = "pro" | "vip";

/**
 * ラベルを導くのに要るプラン状況の形
 * プラン状況の種類
 *
 * `kind` だけを要求する。web の `PlanStatus`（`until: Date`）とアプリ向け API の
 * `MobilePlanStatus`（`until?: string`）は期限の型が違い、`kind` の語彙だけが共通なので、
 * `kind` だけを受ければどちらもそのまま渡せる。
 */
export interface PlanBadgeSource {
  readonly kind: "lifetime" | "pass" | "granted" | "free";
}

/**
 * プラン状況からラベルの種類を導く
 * プランバッジ導出
 *
 * `lifetime` / `pass` → `"pro"`、`granted` → `"vip"`、`free` → `undefined`（ラベルを出さない）。
 * `kind` を足したら網羅性の検査で落ちる。
 */
export function planBadgeOf(status: PlanBadgeSource): PlanBadge | undefined {
  const { kind } = status;
  switch (kind) {
    case "lifetime":
    case "pass":
      return "pro";
    case "granted":
      return "vip";
    case "free":
      return undefined;
    default: {
      const exhaustive: never = kind;
      return exhaustive;
    }
  }
}
