import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { ClockIcon } from "@/app/(user)/_components/icons/clock-icon";
import { InfinityIcon } from "@/app/(user)/_components/icons/infinity-icon";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { OFFER_KEYS, PLANS } from "@/lib/billing/plans";
import { formatAmount, getOfferPrices } from "@/lib/billing/prices";
import { PRACTICE_QUOTA_LIMITS } from "@/lib/practice-quota/limits";

import { OfferPurchaseButton } from "./_components/offer-purchase-button";

export async function generateMetadata(): Promise<Metadata> {
  // パスはリテラルで書く（seo-coverage.test が canonical の宣言を文字列で検査する）
  return createNamespaceMetadata("plan", { title: "pageTitle", path: "/plan" });
}

/**
 * 料金ページ
 * 料金ページ
 *
 * @description
 * Pro プランの特典と、2 つの売り方（30 日パス / 買い切り）の価格と購入ボタン。
 * 価格は Stripe の Price から読む（1 日キャッシュ）。読めないときは価格欄を
 * 伏せて購入ボタンだけ出す（Checkout が正しい価格を出す）。
 *
 * 静的ページ。ログインしているかは購入ボタン（クライアント）が認証
 * コンテキストで決める。
 *
 * @flow
 * 1. 特典を読む → 売り方を選んで「購入する」
 * 2. 未ログインなら「ログインして購入」でサインインへ（戻り先はこのページ）
 * 3. ログイン済みなら Stripe の決済画面へ → 完了すると `/mypage/plan` に戻る
 */
export default async function PlanPage() {
  const t = await getTranslations("plan");
  const prices = await getOfferPrices("pro");
  const plan = PLANS.pro;

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitle>{t("perks.title")}</SectionTitle>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-xl bg-primary-50 p-5">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-200 text-primary-800"
              >
                <InfinityIcon className="size-7" />
              </span>
              <div className="space-y-1">
                <h3 className="font-bold text-primary-900">
                  {t("perks.unlimitedTitle")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("perks.unlimited")}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-xl bg-primary-50 p-5">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-200 text-primary-800"
              >
                <ClockIcon className="size-7" />
              </span>
              <div className="space-y-1">
                <h3 className="font-bold text-primary-900">
                  {t("perks.toolsTitle")}
                </h3>
                <p className="text-sm leading-relaxed">{t("perks.tools")}</p>
              </div>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-surface-600">
            {t("perks.freeLimits", {
              score: PRACTICE_QUOTA_LIMITS.score.signedIn,
              machi: PRACTICE_QUOTA_LIMITS["machi-score"].signedIn,
            })}
          </p>
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("offers.title")}</SectionTitle>
          <p className="text-sm leading-relaxed">{t("offers.shared")}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {OFFER_KEYS.map((offer) => {
              const price = prices?.find((view) => view.offer === offer);
              return (
                <div
                  key={offer}
                  className="flex flex-col gap-4 rounded-xl border-3 border-ink bg-white p-5"
                >
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold">
                      {t(`offers.${offer}.title`)}
                    </h3>
                    <p className="text-sm leading-relaxed text-surface-600">
                      {t(`offers.${offer}.description`)}
                    </p>
                  </div>
                  <p className="text-2xl font-bold tabular-nums">
                    {price ? (
                      <>
                        {formatAmount(price.amount, price.currency)}
                        <span className="ml-1 text-xs font-medium text-surface-500">
                          {t("offers.taxIncluded")}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-medium text-surface-500">
                        {t("offers.priceUnavailable")}
                      </span>
                    )}
                  </p>
                  <div className="mt-auto">
                    <OfferPurchaseButton offer={plan.offers[offer].key} />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-sm leading-relaxed text-surface-600">
            {t("offers.lifetimeScope")}
          </p>
        </section>

        <section className="space-y-4">
          <SectionTitle>{t("notes.title")}</SectionTitle>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-surface-600">
            <li>{t("notes.pass")}</li>
            <li>{t("notes.snapshot")}</li>
            <li>{t("notes.noRefund")}</li>
            <li>{t("notes.receipt")}</li>
            <li>{t("notes.deletion")}</li>
          </ul>
          <p className="text-sm">
            {t.rich("notes.tokushoho", {
              link: (chunks) => (
                <Link href="/tokushoho" className={TEXT_LINK_CLASSES}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <p className="text-center text-sm">
          <Link href="/mypage/plan" className={TEXT_LINK_CLASSES}>
            {t("manageLink")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
