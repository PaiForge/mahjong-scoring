import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TableHead } from "@/app/admin/_components/table-head";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  counterpartSlot,
  kindForSlot,
  placementsForSlot,
  platformForSlot,
  surfacesForSlot,
  type AdSlot,
} from "@/lib/ads/registry";

import { adsSlotHref } from "../_lib/list-href";
import { adminCreativeLabel, type getAllAdCreatives } from "../_lib/queries";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";
import { CreativeRowActions } from "./creative-row-actions";

type Creative = Awaited<ReturnType<typeof getAllAdCreatives>>[number];

/**
 * 広告管理の 1 スロットの節（見出し・掲載先・対のスロット・一覧）
 * スロットの節
 *
 * 一覧には掲載 / 停止と、画面に出ている印（掲載中のうち並び順の先頭から
 * 枠数まで）を付ける。
 */
export async function AdSlotSection({
  slot,
  creatives,
  isServable,
}: {
  readonly slot: AdSlot;
  /** このスロットの広告（並び順） */
  readonly creatives: readonly Creative[];
  /** 画面に出せる広告か（リンクが決まるもの） */
  readonly isServable: (row: Creative["row"]) => boolean;
}) {
  const t = await getTranslations("admin.ads");
  const platform = platformForSlot(slot);
  const counterpart = counterpartSlot(slot);
  // 画面に出るのは掲載中のうち並び順の先頭から枠数まで
  const placements = placementsForSlot(slot);
  const displayedIds = new Set(
    creatives
      .filter((c) => isServable(c.row))
      .slice(0, placements)
      .map((c) => c.row.id),
  );

  return (
    <section id={slot} className="admin-panel scroll-mt-6">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-surface-200 px-4 py-3">
        <div className="space-y-1">
          <code className="text-sm font-semibold text-surface-800">{slot}</code>
          <p className="text-xs text-surface-500">
            {t("slotKind")}: {t(`kinds.${kindForSlot(slot)}`)}
            {placements > 1 && <> / {t("placements", { count: placements })}</>}
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
                  // アプリの画面は href を持たない（ブラウザで開けない）。
                  // 置かれる位置は対の web のスロットの掲載先で見る
                  surface.route
                )}
              </span>
            ))}
          </p>
          <p className="text-xs text-surface-500">
            {t(`counterpart.${platform}`)}:{" "}
            {counterpart === undefined ? (
              t("counterpartNone")
            ) : (
              <Link
                href={adsSlotHref(counterpart)}
                className={`font-mono ${TEXT_LINK_CLASSES}`}
              >
                {counterpart}
              </Link>
            )}
          </p>
        </div>
        <Link
          href={`/admin/ads/new?slot=${encodeURIComponent(slot)}`}
          className={adminButtonClasses()}
        >
          {t("new")}
        </Link>
      </header>

      {creatives.length === 0 ? (
        <p className="px-4 py-3 text-sm text-surface-400">{t("empty")}</p>
      ) : (
        <div className="admin-table">
          <table className="w-full text-left text-sm">
            <TableHead
              labels={[t("order"), t("title"), t("status"), t("actions")]}
            />
            <tbody>
              {creatives.map(({ row, copy }, index) => (
                <tr key={row.id} className="border-t border-surface-200">
                  <td className="px-4 py-3 text-surface-500">{index + 1}</td>
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
                      {row.isActive ? t("statusActive") : t("statusInactive")}
                    </span>
                    {displayedIds.has(row.id) && (
                      <span className={`ml-2 ${adminChipClasses("warning")}`}>
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
                        isLast={index === creatives.length - 1}
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
}
