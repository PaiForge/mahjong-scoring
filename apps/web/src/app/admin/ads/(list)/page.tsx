/**
 * ネイティブ広告管理
 *
 * @description
 * スロット（掲載枠）ごとに広告を並べ、掲載の切り替え・並べ替え・作成・編集を
 * 行う。スロットの一覧と掲載先は `lib/ads/registry.ts` から引く。
 * @flow
 * スロットの「新規作成」から広告を作り、一覧で掲載 / 停止と並び順を決める。
 * 1 冊の本をスロットごとに登録した広告は、タイトル別の一括更新
 * （/admin/ads/links）でリンクと掲載状態をまとめて変えられる。
 * 各スロットで掲載中の広告のうち、並び順の先頭からスロットの枠数だけが
 * 画面に出る。
 */
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { AdminPageTitle } from "@/app/admin/_components/admin-page-title";
import { requireAdminPage } from "@/app/admin/_lib/auth";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  AD_SLOT_VALUES,
  kindForSlot,
  placementsForSlot,
  surfacesForSlot,
} from "@/lib/ads/registry";

import { resolveAdHref } from "@/lib/ads/amazon";

import { CreativeRowActions } from "../_components/creative-row-actions";
import { TrackingIdForm } from "../_components/tracking-id-form";
import {
  adminCreativeLabel,
  getAllAdCreatives,
  getAmazonTrackingId,
} from "../_lib/queries";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";

export const dynamic = "force-dynamic";

export default async function AdminAdsPage() {
  await requireAdminPage();

  const [t, creatives, trackingId] = await Promise.all([
    getTranslations("admin.ads"),
    getAllAdCreatives(),
    getAmazonTrackingId(),
  ]);
  // 画面に出せる広告（リンクが決まるもの）。ASIN の広告はトラッキング ID が
  // 未設定なら出ない（`getNativeAdCreatives` と同じ判定）
  const isServable = (row: (typeof creatives)[number]["row"]) =>
    row.isActive && resolveAdHref(row, trackingId) !== undefined;
  const hiddenAsinCount = creatives.filter(
    ({ row }) => row.isActive && !isServable(row),
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

      <TrackingIdForm
        trackingId={trackingId}
        hiddenAsinCount={hiddenAsinCount}
      />

      {AD_SLOT_VALUES.map((slot) => {
        const inSlot = creatives.filter((c) => c.row.slot === slot);
        // 画面に出るのは掲載中のうち並び順の先頭から枠数まで
        const placements = placementsForSlot(slot);
        const displayedIds = new Set(
          inSlot
            .filter((c) => isServable(c.row))
            .slice(0, placements)
            .map((c) => c.row.id),
        );

        return (
          <section key={slot} className="admin-panel">
            <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-200 px-4 py-3">
              <div className="space-y-1">
                <code className="text-sm font-semibold text-surface-800">
                  {slot}
                </code>
                <p className="text-xs text-surface-500">
                  {t("slotKind")}: {t(`kinds.${kindForSlot(slot)}`)}
                  {placements > 1 && (
                    <> / {t("placements", { count: placements })}</>
                  )}
                </p>
                <p className="text-xs text-surface-500">
                  {t("surfaces")}:{" "}
                  {surfacesForSlot(slot).map((surface, i) => (
                    <span key={surface.route}>
                      {i > 0 && ", "}
                      {surface.href !== undefined ? (
                        <Link href={surface.href} className={TEXT_LINK_CLASSES}>
                          {surface.route}
                        </Link>
                      ) : (
                        surface.route
                      )}
                    </span>
                  ))}
                </p>
              </div>
              <Link
                href={`/admin/ads/new?slot=${encodeURIComponent(slot)}`}
                className={adminButtonClasses()}
              >
                {t("new")}
              </Link>
            </header>

            {inSlot.length === 0 ? (
              <p className="px-4 py-3 text-sm text-surface-400">{t("empty")}</p>
            ) : (
              <div className="admin-table">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-200 text-xs text-surface-500">
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("order")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("title")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("status")}
                      </th>
                      <th className="px-4 py-2 font-medium whitespace-nowrap">
                        {t("actions")}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {inSlot.map(({ row, copy }, index) => (
                      <tr key={row.id} className="border-t border-surface-200">
                        <td className="px-4 py-3 text-surface-500">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 text-surface-900">
                          <span className="mr-2" aria-hidden="true">
                            {row.icon}
                          </span>
                          {adminCreativeLabel(copy)}
                          <div className="font-mono text-xs text-surface-400">
                            {row.id}
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={adminChipClasses(
                              row.isActive ? "success" : "neutral",
                            )}
                          >
                            {row.isActive
                              ? t("statusActive")
                              : t("statusInactive")}
                          </span>
                          {displayedIds.has(row.id) && (
                            <span
                              className={`ml-2 ${adminChipClasses("warning")}`}
                            >
                              {t("displayed")}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-3">
                            <Link
                              href={`/admin/ads/${row.id}/edit`}
                              className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
                            >
                              {t("edit")}
                            </Link>
                            <CreativeRowActions
                              creativeId={row.id}
                              isActive={row.isActive}
                              isFirst={index === 0}
                              isLast={index === inSlot.length - 1}
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
