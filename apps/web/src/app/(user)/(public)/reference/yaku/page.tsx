/**
 * 役一覧（チートシート）
 *
 * @description
 * 各役を翻数別に一覧表示するビジュアル早見表。一覧そのものは
 * `YakuCheatsheet` が持ち、点数訓練の答え合わせから開くモーダルと共有する。
 * 各カードは `yakuAnchorId` の id を持ち、教本（/learn/yaku）から
 * 役名リンクで直接開いた状態に着地できる。
 *
 * @flow
 * リファレンスハブ（/reference）の「役一覧」カードか、教本の翻数別まとめの
 * 役名リンクから遷移して閲覧する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { YakuCheatsheet } from "./_components/yaku-cheatsheet";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("reference.yaku", {
    path: "/reference/yaku",
  });
}

export default async function ReferenceYakuPage() {
  const t = await getTranslations("reference.yaku");
  const tHub = await getTranslations("reference");

  return (
    <ContentContainer
      breadcrumb={[
        { label: tHub("title"), href: "/reference" },
        { label: t("title") },
      ]}
    >
      <PageTitle>{t("title")}</PageTitle>

      <YakuCheatsheet withAnchors />

      <p className="mt-6 text-sm text-surface-500">{t("nakiNote")}</p>
    </ContentContainer>
  );
}
