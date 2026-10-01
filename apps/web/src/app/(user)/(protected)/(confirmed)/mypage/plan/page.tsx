import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import {
  DATA_TABLE_CELL_PADDING,
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import {
  benefitGrantStateOf,
  formatPlanDate,
  formatPlanDateShort,
  planStatusOf,
  purchaseStateOf,
} from "@/lib/billing/plan-status";
import { PLAN_PAGE_HREF, PurchaseKind } from "@/lib/billing/plans";
import { formatAmount } from "@/lib/billing/prices";
import { listPurchases } from "@/lib/billing/purchases";
import { listBenefitGrants } from "@/lib/entitlements/benefit-grants";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypagePlan");
}

interface MypagePlanPageProps {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * マイページ: Pro プラン
 * プラン状況
 *
 * @description
 * いまの状態（無料 / パスの期限 / 買い切り / 運営からの付与）と購入履歴。
 * Checkout 完了の着地（`/api/stripe/checkout/complete`）が `?status=success` を
 * 付けてここへ送る。購入ボタンは置かず、料金ページへ送る（価格と注意書きは
 * あちらにある）。
 *
 * 運営が手動で付けた特典（`benefit_grants`）は「付与された特典」として購入履歴と
 * 別の表に出す。金額が無く、Stripe の領収書も無いため同じ表に混ぜない。付与の
 * 理由は運営の内部メモになり得るので出さない。
 *
 * @flow
 * 1. 状態を見る → 購入が有効でなければ「Pro を購入する」で料金ページへ
 * 2. 購入履歴で日付・内容・金額・状態（有効 / 開始待ち / 期限切れ / 返金済み）を見る
 * 3. 付与があれば「付与された特典」で期間と状態（有効 / 期限切れ / 取り消し済み）を見る
 */
export default async function MypagePlanPage({
  searchParams,
}: MypagePlanPageProps) {
  const { user } = await requireConfirmedUser();
  const [t, tMypage, purchases, grants, { status }] = await Promise.all([
    getTranslations("mypagePlan"),
    getTranslations("mypage"),
    listPurchases(user.id),
    listBenefitGrants(user.id),
    searchParams,
  ]);
  const now = new Date();
  const plan = planStatusOf(purchases, grants, now);
  // 開始待ちの旧購入も再購入させない。手動付与しか無い人は購入できる。
  const canPurchase = !purchases.some(
    (purchase) =>
      !purchase.revokedAt && (!purchase.expiresAt || purchase.expiresAt > now),
  );

  return (
    <ContentContainer
      breadcrumb={[
        { label: tMypage("pageTitle"), href: "/mypage" },
        { label: t("pageTitle") },
      ]}
    >
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        {(status === "success" ||
          status === "pending" ||
          status === "failed") && (
          <p
            role="status"
            className="rounded-xl border-3 border-ink bg-primary-50 px-4 py-3 text-sm font-bold"
          >
            {t(status)}
          </p>
        )}

        <section className="space-y-4">
          <SectionTitle>{t("status.title")}</SectionTitle>
          <div className="space-y-3 rounded-xl border-3 border-ink bg-white p-5">
            <p className="text-lg font-bold">
              {plan.kind === "lifetime" && t("status.lifetime")}
              {plan.kind === "pass" &&
                t("status.pass", { until: formatPlanDate(plan.until) })}
              {plan.kind === "granted" &&
                (plan.until
                  ? t("status.grantedUntil", {
                      until: formatPlanDate(plan.until),
                    })
                  : t("status.granted"))}
              {plan.kind === "free" && t("status.free")}
            </p>
            <p className="text-sm leading-relaxed text-surface-600">
              {plan.kind === "lifetime" && t("status.lifetimeHint")}
              {plan.kind === "pass" && t("status.passHint")}
              {plan.kind === "granted" && t("status.grantedHint")}
              {plan.kind === "free" && t("status.freeHint")}
            </p>
            {canPurchase && (
              <LinkButton href={PLAN_PAGE_HREF} size="lg" fullWidth>
                {t("status.buy")}
              </LinkButton>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("history.title")}</SectionTitle>
          {purchases.length === 0 ? (
            <p className="text-sm text-surface-600">{t("history.empty")}</p>
          ) : (
            <DataTable
              header={
                <>
                  <DataTableHeaderCell align="left">
                    {t("history.date")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell align="left">
                    {t("history.item")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell align="right">
                    {t("history.amount")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>
                    {t("history.state")}
                  </DataTableHeaderCell>
                </>
              }
            >
              {purchases.map((purchase) => {
                const state = purchaseStateOf(purchase, now);
                const cell = DATA_TABLE_CELL_PADDING.default;
                return (
                  <tr key={purchase.id} className="text-sm">
                    <td className={`${cell} text-left tabular-nums`}>
                      {formatPlanDateShort(purchase.createdAt)}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-left`}>
                      {purchase.kind === PurchaseKind.Lifetime
                        ? t("history.kind.lifetime")
                        : t("history.kind.pass")}
                    </td>
                    <td className={`${cell} text-right tabular-nums`}>
                      {formatAmount(purchase.amount, purchase.currency)}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-center`}>
                      {t(`history.state_${state}`)}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
          <p className="text-xs text-surface-500">{t("history.receiptHint")}</p>
        </section>

        {grants.length > 0 && (
          <section className="space-y-4">
            <SectionTitle>{t("grants.title")}</SectionTitle>
            <DataTable
              header={
                <>
                  <DataTableHeaderCell align="left">
                    {t("grants.date")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell align="left">
                    {t("grants.item")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell align="left">
                    {t("grants.period")}
                  </DataTableHeaderCell>
                  <DataTableHeaderCell>{t("grants.state")}</DataTableHeaderCell>
                </>
              }
            >
              {grants.map((grant) => {
                const state = benefitGrantStateOf(grant, now);
                const cell = DATA_TABLE_CELL_PADDING.default;
                return (
                  <tr key={grant.id} className="text-sm">
                    <td className={`${cell} text-left tabular-nums`}>
                      {formatPlanDateShort(grant.createdAt)}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-left`}>
                      {grant.plan === "pro" ? t("grants.pro") : grant.plan}
                    </td>
                    <td
                      className={`${cell} whitespace-nowrap text-left tabular-nums`}
                    >
                      {grant.expiresAt
                        ? t("grants.until", {
                            until: formatPlanDateShort(grant.expiresAt),
                          })
                        : t("grants.permanent")}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-center`}>
                      {t(`grants.state_${state}`)}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          </section>
        )}
      </div>
    </ContentContainer>
  );
}
