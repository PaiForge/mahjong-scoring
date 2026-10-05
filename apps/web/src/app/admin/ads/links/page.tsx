/**
 * 広告のタイトル別一括更新
 *
 * @description
 * 同じタイトルの広告（1 冊の本の、スロットごとの行）を束ね、リンクの差し替えと
 * 掲載 / 停止を全スロットへまとめて適用する。1 冊がスロットの数だけ行を
 * 持つため、行ごとの編集では貼り忘れが起きる。個別の編集画面はそのまま使える。
 * @flow
 * 広告管理（/admin/ads）の「タイトル別の一括更新」から開く。まとまりが含む
 * スロットを確かめてから、リンクを入れて適用する / まとめて掲載・停止する。
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

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
  const groups = groupCreativesByTitle(
    creatives.map(({ row, copy }) => ({
      id: row.id,
      slot: row.slot,
      href: row.href,
      asin: row.asin,
      isActive: row.isActive,
      title: adminCreativeLabel(copy),
    })),
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
