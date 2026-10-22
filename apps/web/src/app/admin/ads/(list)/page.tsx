/**
 * ネイティブ広告管理
 *
 * @description
 * スロット（掲載枠）ごとに広告を並べ、掲載の切り替え・並べ替え・作成・編集を
 * 行う。スロットの一覧と掲載先は `lib/ads/registry.ts` から引く。web と
 * アプリのスロットはタブで分け、トラッキング ID の欄もタブの側の 1 つだけを
 * 出す。同じ画面のもう片方のスロットへは見出しのリンクで行き来する。
 *
 * @design プラットフォームのタブで分ける
 * この一覧で行うのは 1 スロットの並べ替え・停止・作成で、どれも片方だけの
 * 操作になる。同じ本を web とアプリの両方に出す・止めるのは本ごとの操作で、
 * タイトル別の一括更新が担う。画面ごとに web とアプリを並べる形も考えたが、
 * 1 ページの量が減らず、web だけの画面で形が崩れるため採らなかった。
 * @flow
 * タブで web / アプリを選ぶ。スロットの「新規作成」から広告を作り、一覧で
 * 掲載 / 停止と並び順を決める。
 * 1 冊の本をスロットごとに登録した広告は、タイトル別の一括更新
 * （/admin/ads/links）でリンクと掲載状態をまとめて変えられる。
 * 各スロットで掲載中の広告のうち、並び順の先頭からスロットの枠数だけが
 * 画面に出る。
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createSearchParamsCache, parseAsStringLiteral } from "nuqs/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { AdminTabs } from "@/app/admin/_components/admin-tabs";
import { HashAnchorScroll } from "@/app/_components/hash-anchor-scroll";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  AD_PLATFORMS,
  AD_SLOT_VALUES,
  isAdSlot,
  platformForSlot,
} from "@/lib/ads/registry";

import { resolveAdHref } from "@/lib/ads/amazon";

import { AdSlotSection } from "../_components/ad-slot-section";
import { adsListHref } from "../_lib/list-href";
import { TrackingIdForm } from "../_components/tracking-id-form";
import { getAllAdCreatives, getAmazonTrackingIds } from "../_lib/queries";

export const dynamic = "force-dynamic";

const searchParamsCache = createSearchParamsCache({
  platform: parseAsStringLiteral(AD_PLATFORMS).withDefault("web"),
});

export default async function AdminAdsPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminPage();
  const { platform } = await searchParamsCache.parse(searchParams);
  const slots = AD_SLOT_VALUES.filter(
    (slot) => platformForSlot(slot) === platform,
  );

  const [t, creatives, trackingIds] = await Promise.all([
    getTranslations("admin.ads"),
    getAllAdCreatives(),
    getAmazonTrackingIds(),
  ]);
  type Row = (typeof creatives)[number]["row"];
  // 画面に出せる広告（リンクが決まるもの）。ASIN の広告はスロットを読む側の
  // トラッキング ID が未設定なら出ない（`getNativeAdCreatives` と同じ判定）
  const isServable = (row: Row) =>
    row.isActive &&
    isAdSlot(row.slot) &&
    resolveAdHref(row, trackingIds[platformForSlot(row.slot)]) !== undefined;
  const hiddenAsinCount = creatives.filter(
    ({ row }) =>
      row.isActive &&
      isAdSlot(row.slot) &&
      platformForSlot(row.slot) === platform &&
      !isServable(row),
  ).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitle>{t("listTitle")}</AdminPageTitle>
        <p className="text-sm text-surface-500">{t("listDescription")}</p>
        <Link
          href="/admin/ads/links"
          className={`text-sm ${TEXT_LINK_CLASSES}`}
        >
          {t("linksEntry")}
        </Link>
      </div>

      {/* 作成・編集から `#<スロット>` 付きで戻ったとき、本体が届いてから着地させる */}
      <HashAnchorScroll key={`anchor-${platform}`} />

      <AdminTabs
        label={t("platformTabs")}
        tabs={AD_PLATFORMS.map((tab) => ({
          href: adsListHref(tab),
          label: t(`platforms.${tab}`),
          current: tab === platform,
        }))}
      />

      <TrackingIdForm
        // タブを切り替えたら入力中の値を捨てる（別の ID の欄になるため）
        key={`tracking-id-${platform}`}
        platform={platform}
        trackingId={trackingIds[platform]}
        hiddenAsinCount={hiddenAsinCount}
      />

      {slots.map((slot) => (
        <AdSlotSection
          key={slot}
          slot={slot}
          creatives={creatives.filter((c) => c.row.slot === slot)}
          isServable={isServable}
        />
      ))}
    </div>
  );
}
