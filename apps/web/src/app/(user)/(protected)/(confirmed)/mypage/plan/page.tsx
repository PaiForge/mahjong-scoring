import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  DATA_TABLE_CELL_PADDING,
  DataTable,
  DataTableHeaderCell,
} from "@/app/(user)/_components/data-table";
import { LinkButton } from "@/app/(user)/_components/link-button";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createPrivateMetadata } from "@/app/_lib/metadata";
import { requireConfirmedUser } from "@/lib/auth";
import {
  benefitGrantStateOf,
  blocksNewPurchase,
  formatPlanDate,
  formatPlanDateShort,
  planStatusOf,
  purchaseProviderOf,
  purchaseStateOf,
  type PlanStatus,
} from "@/lib/billing/plan-status";
import {
  PLAN_PAGE_HREF,
  PurchaseKind,
} from "@mahjong-scoring/features/billing/plans";
import { PurchaseProvider } from "@mahjong-scoring/features/billing/provider";
import { formatAmount } from "@/lib/billing/prices";
import { listPurchases } from "@/lib/billing/purchases";
import { listBenefitGrants } from "@/lib/entitlements/benefit-grants";
import { MypageSubpageLayout } from "../_components/mypage-subpage-layout";

export async function generateMetadata(): Promise<Metadata> {
  return createPrivateMetadata("mypagePlan");
}

type PlanTranslator = Awaited<ReturnType<typeof getTranslations<"mypagePlan">>>;

/**
 * プラン状況の見出しと補足の文言
 * プラン状況の文言
 *
 * `PlanStatus` の種類を足したら、ここが網羅性の検査で落ちる（見出しが空の
 * まま描画されない）。
 */
function describePlanStatus(
  plan: PlanStatus,
  t: PlanTranslator,
): { readonly heading: string; readonly hint: string } {
  switch (plan.kind) {
    case "lifetime":
      return { heading: t("status.lifetime"), hint: t("status.lifetimeHint") };
    case "pass":
      return {
        heading: t("status.pass", { until: formatPlanDate(plan.until) }),
        hint: t("status.passHint"),
      };
    case "granted":
      return {
        heading: plan.until
          ? t("status.grantedUntil", { until: formatPlanDate(plan.until) })
          : t("status.granted"),
        hint: t("status.grantedHint"),
      };
    case "free":
      return { heading: t("status.free"), hint: t("status.freeHint") };
    default: {
      const exhaustive: never = plan;
      return exhaustive;
    }
  }
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
 * 購入履歴は決済元（web の Stripe / iOS アプリの App Store）を「購入元」の列に
 * 出す。領収書の在処は決済元ごとに違うので、履歴にある決済元の分だけ案内を出す。
 *
 * 運営が手動で付けた特典（`benefit_grants`）は「付与された特典」として購入履歴と
 * 別の表に出す。金額が無く、Stripe の領収書も無いため同じ表に混ぜない。付与の
 * 理由は運営の内部メモになり得るので出さない。
 *
 * @flow
 * 1. 状態を見る → 購入が有効でなければ「Pro を購入する」で料金ページへ
 * 2. 購入履歴で日付・内容・金額・購入元・状態（有効 / 開始待ち / 期限切れ / 返金済み）を見る
 * 3. 付与があれば「付与された特典」で期間と状態（有効 / 期限切れ / 取り消し済み）を見る
 */
export default async function MypagePlanPage({
  searchParams,
}: MypagePlanPageProps) {
  const { user } = await requireConfirmedUser();
  const [t, purchases, grants, { status }] = await Promise.all([
    getTranslations("mypagePlan"),
    listPurchases(user.id),
    listBenefitGrants(user.id),
    searchParams,
  ]);
  const now = new Date();
  const plan = planStatusOf(purchases, grants, now);
  const canPurchase = !purchases.some((purchase) =>
    blocksNewPurchase(purchase, now),
  );
  const providers = new Set(purchases.map(purchaseProviderOf));
  const statusCopy = describePlanStatus(plan, t);

  return (
    <MypageSubpageLayout title={t("pageTitle")}>
      <div className="space-y-8">
        {(status === "success" ||
          status === "pending" ||
          status === "failed") && (
          <p
            role="status"
            className="rounded-panel border border-panel bg-brand-subtle px-4 py-3 text-sm font-bold"
          >
            {t(status)}
          </p>
        )}

        <section className="space-y-4">
          <SectionTitle>{t("status.title")}</SectionTitle>
          <div className="space-y-3 rounded-panel border border-panel bg-white p-5">
            <p className="text-lg font-bold">{statusCopy.heading}</p>
            <p className="text-sm leading-relaxed text-surface-600">
              {statusCopy.hint}
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
                  <DataTableHeaderCell align="left">
                    {t("history.provider.label")}
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
                    <td className={`${cell} whitespace-nowrap text-left`}>
                      {t(`history.provider.${purchaseProviderOf(purchase)}`)}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-center`}>
                      {t(`history.state_${state}`)}
                    </td>
                  </tr>
                );
              })}
            </DataTable>
          )}
          {providers.has(PurchaseProvider.Stripe) && (
            <p className="text-xs text-surface-500">
              {t("history.receiptHint")}
            </p>
          )}
          {providers.has(PurchaseProvider.Apple) && (
            <p className="text-xs text-surface-500">
              {t("history.receiptHintApple")}
            </p>
          )}
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
    </MypageSubpageLayout>
  );
}
