import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { ClockIcon } from "@/app/[locale]/(user)/_components/icons/clock-icon";
import { InfinityIcon } from "@/app/[locale]/(user)/_components/icons/infinity-icon";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import {
  OFFER_KEYS,
  PLAN_PAGE_HREF,
  PLANS,
} from "@mahjong-scoring/features/billing/plans";
import { formatAmount, getOfferPrices } from "@/lib/billing/prices";
import { PRACTICE_QUOTA_LIMITS } from "@mahjong-scoring/features/quota/limits";

import { OfferPurchaseButton } from "./_components/offer-purchase-button";
import { MYPAGE_PLAN_PATH } from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * 金額の書式の地域（`Intl.NumberFormat` のロケール）
 *
 * 通貨・税・販売地域は言語で変えない（日本円・税込のまま）。区切りと通貨記号の
 * 並びだけをページの言語に合わせる（英語は `¥480`）。英語の購入者には
 * `plan.offers.shared` の「Prices are in Japanese yen (JPY)」と
 * `plan.offers.taxIncluded` で通貨と税込を知らせ、請求通貨は Stripe の
 * Checkout が表示する。マイページの購入状況（`mypage/plan/page.tsx`）と同じ表で、
 * `lib/billing/prices.ts` へは移さない（購入の共有ロジックの担当と重ならないよう
 * ページに持つ）。
 */
const AMOUNT_FORMAT_LOCALES = {
  ja: "ja-JP",
  en: "en-US",
} as const satisfies Record<SupportedLocale, string>;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/plan">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/plan");
  // パスはリテラルで書く（seo-coverage.test が canonical の宣言を文字列で検査する）
  return createNamespaceMetadata("plan", {
    title: "pageTitle",
    path: PLAN_PAGE_HREF,
    locale,
  });
}

/**
 * ISR の間隔（1 時間）
 *
 * 価格データのキャッシュ（`getOfferPrices`、1 日）とは別に、ページの HTML を
 * 1 時間ごとに作り直す。価格データが未取得（ビルド直後・キャッシュ期限切れ後）
 * のときに Stripe が落ちていると、価格欄を伏せた HTML が出来上がる。ページの
 * 間隔を価格データの間隔（1 日）に任せると、その HTML が最長 1 日残る。
 *
 * 再描画は価格データのキャッシュを読むだけで、キャッシュが生きていれば Stripe を
 * 叩かない。Stripe への呼び出しが増えるのは、価格データが未取得のまま障害が
 * 続いている間だけ（1 時間に 1 回の再試行）。価格改定の反映も、価格データの
 * 期限切れ後 1 時間以内になる（この値が無いと最長 2 日）。
 */
export const revalidate = 3600;

/**
 * 料金ページ
 *
 * @description
 * Pro プランの特典と、2 つの売り方（30 日パス / 買い切り）の価格と購入ボタン。
 * 価格は Stripe の Price から読む（1 日キャッシュ）。読めないときは価格欄を
 * 伏せて購入ボタンだけ出す（Checkout が正しい価格を出す）。
 *
 * 静的ページ（ISR、{@link revalidate} 参照）。ログインしているかは購入ボタン
 * （クライアント）が認証コンテキストで決める。
 *
 * @flow
 * 1. 特典を読む → 売り方を選んで「購入する」
 * 2. 未ログインなら「ログインして購入」でサインインへ（戻り先はこのページ）
 * 3. ログイン済みなら Stripe の決済画面へ → 完了すると `/mypage/plan` に戻る
 *
 * @design 英語の料金ページと英語からの購入
 * ページの言語（`prepareRouteLocale` の戻り値）を metadata・金額の書式
 * （{@link AMOUNT_FORMAT_LOCALES}）・本文のリンク・購入ボタンに明示で渡す。
 * 特商法の表記と購入状況へのリンクは公開状態の表から張る先を決める
 * （`resolveNavTargetFor`。英語で公開していれば `/en/...`）。購入ボタンは
 * クライアント部品なので公開状態を読まず、言語だけを props で受けて
 * サインインの戻り先（英語の料金ページ）と Server Action の引数に使う。
 * Checkout の言語・戻り先は予約に保存した言語から組まれる。
 */
export default async function PlanPage({
  params,
}: PageProps<"/[locale]/plan">) {
  const locale = await prepareRouteLocale(params, "/plan");
  const t = await getTranslations("plan");
  const amountLocale = AMOUNT_FORMAT_LOCALES[locale];
  const tokushohoHref = resolveNavTargetFor("/tokushoho", locale).href;
  const mypagePlanHref = resolveNavTargetFor(MYPAGE_PLAN_PATH, locale).href;
  const prices = await getOfferPrices("pro");
  const plan = PLANS.pro;

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionTitle>{t("perks.title")}</SectionTitle>
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <li className="flex items-start gap-3 rounded-panel bg-brand-subtle p-5">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-brand-subtle-foreground"
              >
                <InfinityIcon className="size-7" />
              </span>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground">
                  {t("perks.unlimitedTitle")}
                </h3>
                <p className="text-sm leading-relaxed">
                  {t("perks.unlimited")}
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3 rounded-panel bg-brand-subtle p-5">
              <span
                aria-hidden="true"
                className="flex size-12 shrink-0 items-center justify-center rounded-full bg-card text-brand-subtle-foreground"
              >
                <ClockIcon className="size-7" />
              </span>
              <div className="space-y-1">
                <h3 className="font-bold text-foreground">
                  {t("perks.toolsTitle")}
                </h3>
                <p className="text-sm leading-relaxed">{t("perks.tools")}</p>
              </div>
            </li>
          </ul>
          <p className="text-sm leading-relaxed text-surface-600">
            {t("perks.freeLimits", {
              agari: PRACTICE_QUOTA_LIMITS["agari-score"].signedIn,
              tenpai: PRACTICE_QUOTA_LIMITS["tenpai-score"].signedIn,
              exam: PRACTICE_QUOTA_LIMITS["score-exam"].signedIn,
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
                  className="flex flex-col gap-4 rounded-panel border border-panel bg-white p-5"
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
                        {formatAmount(
                          price.amount,
                          price.currency,
                          amountLocale,
                        )}
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
                    <OfferPurchaseButton
                      offer={plan.offers[offer].key}
                      locale={locale}
                    />
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
                <Link href={tokushohoHref} className={TEXT_LINK_CLASSES}>
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <p className="text-center text-sm">
          <Link href={mypagePlanHref} className={TEXT_LINK_CLASSES}>
            {t("manageLink")}
          </Link>
        </p>
      </div>
    </ContentContainer>
  );
}
