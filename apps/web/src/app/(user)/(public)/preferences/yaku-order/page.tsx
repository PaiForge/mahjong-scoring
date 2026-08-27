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

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createTitleOnlyMetadata } from "@/app/_lib/metadata";
import { MembersOnlyGate } from "../_components/members-only-gate";
import { YakuOrderSection } from "../_components/yaku-order-section";
import { YAKU_ORDER_HREF } from "../_lib/anchors";

export async function generateMetadata(): Promise<Metadata> {
  return createTitleOnlyMetadata("settings.yakuOrder", "pageTitle");
}

export default async function YakuOrderPage() {
  const t = await getTranslations("settings");
  const tYakuOrder = await getTranslations("settings.yakuOrder");

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("pageTitle"), href: "/preferences" },
        { label: tYakuOrder("pageTitle") },
      ]}
    >
      <PageTitle>{tYakuOrder("pageTitle")}</PageTitle>

      <MembersOnlyGate redirectTo={YAKU_ORDER_HREF}>
        <section className="space-y-4">
          <SectionTitle>{tYakuOrder("sectionTitle")}</SectionTitle>
          <YakuOrderSection />
        </section>
      </MembersOnlyGate>
    </ContentContainer>
  );
}
