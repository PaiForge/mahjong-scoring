/**
 * 広告のタイトル別一括更新
 *
 * @description
 * 同じタイトルの広告（1 冊の本の、スロットごとの行）を束ね、掲載 / 停止を
 * web とアプリの両方、または片方の全スロットへまとめて適用する。リンクの
 * 差し替えは web / アプリの片方ずつ（トラッキング ID が違うため）。1 冊が
 * スロットの数だけ行を持つため、行ごとの編集では貼り忘れが起きる。個別の
 * 編集画面はそのまま使える。
 * @flow
 * 広告管理（/admin/ads）の「タイトル別の一括更新」から開く。まとまりが含む
 * スロットを確かめてから、両方まとめて掲載・停止する / web・アプリの行で
 * リンクを入れて適用する・その側だけ掲載・停止する。
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { isAdSlot, platformForSlot } from "@/lib/ads/registry";

import { CreativeTitleGroupList } from "../_components/creative-title-group-list";
import { adminCreativeLabel, getAllAdCreatives } from "../_lib/queries";
import { groupCreativesByTitle } from "../_lib/title-groups";

export const dynamic = "force-dynamic";

export default async function AdminAdLinksPage() {
  await requireAdminPage();

  const [t, creatives] = await Promise.all([
    getTranslations("admin.ads"),
    getAllAdCreatives(),
  ]);
  // スロットの定義に無い行（手で書かれた不整合な行）はどちらの画面にも
  // 出ないので束ねない
  const groups = groupCreativesByTitle(
    creatives.flatMap(({ row, copy }) => {
      const slot = row.slot;
      if (!isAdSlot(slot)) return [];
      return [
        {
          id: row.id,
          slot,
          platform: platformForSlot(slot),
          href: row.href,
          asin: row.asin,
          isActive: row.isActive,
          title: adminCreativeLabel(copy),
        },
      ];
    }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <AdminPageTitle>{t("links.title")}</AdminPageTitle>
        <p className="text-sm text-surface-500">{t("links.description")}</p>
        <Link href="/admin/ads" className={`text-sm ${TEXT_LINK_CLASSES}`}>
          {t("links.back")}
        </Link>
      </div>
      <CreativeTitleGroupList groups={groups} />
    </div>
  );
}
