"use client";

import { useTranslations } from "next-intl";

import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { formatJstDateLong } from "@mahjong-scoring/features/jst";

import { useViewerPlan } from "./viewer-plan-provider";

/**
 * 運営からの付与で Pro の人に、付与中であることを添える 1 行
 * 付与中の案内
 *
 * 付与は購入を止めない（`plan-status.ts` の `offersPurchase` の TSDoc — 料金ページ
 * から自分で買いに行く人は買える）ので、購入ボタンは出したままにする。ただし
 * 黙ってボタンだけを出すと、すでに Pro なのに買う必要があるように見え、期限付きの
 * 付与と重ねてパスを買うと重なった日数が無駄になる。そのため付与中であることと
 * 期限を知らせる。
 *
 * 有効な購入がボタンを止めている間は出さない — カードが「利用中」を示しており、
 * 「購入できます」と並ぶと食い違う。
 *
 * 売り方のカードの下に置く。状態が分かってから現れるので、上に置くとカードごと
 * 下へ押し下げる。
 */
export function GrantedPlanNotice({
  locale,
}: {
  readonly locale: SupportedLocale;
}) {
  const t = useTranslations("plan");
  const { plan } = useViewerPlan();
  if (!plan?.granted || plan.purchaseBlock.kind !== "none") return null;

  const { until } = plan.granted;
  return (
    <p className="rounded-panel bg-brand-subtle px-4 py-3 text-sm leading-relaxed">
      {until
        ? t("offers.grantedNotice", {
            until: formatJstDateLong(new Date(until), locale),
          })
        : t("offers.grantedNoticeIndefinite")}
    </p>
  );
}
