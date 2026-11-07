/**
 * 役の並び順
 *
 * @description 役を選ぶときの選択肢の並びを、よく使う順に並び替える。
 * 端末ローカルに保存し、役の選択練習と点数計算練習の両方に効く。
 * 出題内容も正解判定も変えない。
 * @flow 設定 → 役の並び順
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { SectionTitle } from "@/app/[locale]/(user)/_components/section-title";
import { MembersOnlyGate } from "../_components/members-only-gate";
import { membersGateLinks } from "../_lib/members-gate-links";
import { createPreferencesMetadata } from "../_lib/preferences-metadata";
import { YakuOrderSection } from "../_components/yaku-order-section";
import {
  PREFERENCES_PATH,
  YAKU_ORDER_PATH,
} from "@mahjong-scoring/features/routes";
import { prepareRouteLocale } from "@/i18n/route-locale";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/preferences/yaku-order">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, YAKU_ORDER_PATH);
  return createPreferencesMetadata(
    "settings.yakuOrder",
    YAKU_ORDER_PATH,
    locale,
  );
}

export default async function YakuOrderPage({
  params,
}: PageProps<"/[locale]/preferences/yaku-order">) {
  const locale = await prepareRouteLocale(params, YAKU_ORDER_PATH);
  const t = await getTranslations("settings");
  const tYakuOrder = await getTranslations("settings.yakuOrder");

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("pageTitle"), href: PREFERENCES_PATH },
        { label: tYakuOrder("pageTitle") },
      ]}
    >
      <PageTitle>{tYakuOrder("pageTitle")}</PageTitle>

      <MembersOnlyGate links={membersGateLinks(YAKU_ORDER_PATH, locale)}>
        <section className="space-y-4">
          <SectionTitle>{tYakuOrder("sectionTitle")}</SectionTitle>
          <YakuOrderSection />
        </section>
      </MembersOnlyGate>
    </ContentContainer>
  );
}
