"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { useAdsAction } from "../_hooks/use-ads-action";
import { setAdCreativeActiveByTitle } from "../_actions/set-ad-creative-active-by-title";
import { setAdCreativeHrefByTitle } from "../_actions/set-ad-creative-href-by-title";
import type { CreativeTitleGroup } from "../_lib/title-groups";
import { AD_CREATIVE_LIMITS } from "../_lib/validation";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";

interface Props {
  readonly groups: readonly CreativeTitleGroup[];
}

/**
 * タイトル別のまとまりの一覧。1 まとまりに 1 つのリンク欄と、全行をまとめて
 * 掲載 / 停止するボタンを持つ
 * タイトル別一括更新一覧
 *
 * ASIN で指す本（Amazon）はリンクをトラッキング ID と組み立てるため、
 * リンク欄を出さず ASIN を示すだけにする。リンク欄は URL を持つ行がある
 * まとまりにだけ出す。
 *
 * リンク欄は全行が同じリンクのときだけ、そのリンクで始める（済んでいる本が
 * 済んでいると読める）。揃っていなければ空欄で始め、「リンクが揃っていない」
 * と示す — スロットごとにトラッキング ID を変えている本を、うっかり 1 つの
 * リンクで上書きしないため。
 */
export function CreativeTitleGroupList({ groups }: Props) {
  const t = useTranslations("admin.ads.links");

  if (groups.length === 0) {
    return (
      <p className="rounded border border-surface-200 p-8 text-center text-sm text-surface-500">
        {t("empty")}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {groups.map((group) => (
        <CreativeTitleGroupRow key={group.title} group={group} />
      ))}
    </ul>
  );
}

function CreativeTitleGroupRow({
  group,
}: {
  readonly group: CreativeTitleGroup;
}) {
  const t = useTranslations("admin.ads");
  const agreed = group.hrefs.length === 1 ? (group.hrefs[0] ?? "") : "";
  const [href, setHref] = useState(agreed);
  const { isPending, run: runAdsAction } = useAdsAction();
  const total = group.creativeIds.length;

  const run = (
    action: () => Promise<
      { readonly error: string } | { readonly updated: number }
    >,
  ) => {
    runAdsAction(action, (result) => {
      toast.success(t("links.applied", { count: result.updated }));
    });
  };

  return (
    <li className="rounded-lg border border-surface-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-surface-900">{group.title}</span>
        {group.hrefs.length > 1 && (
          <span className={adminChipClasses("warning")}>
            {t("links.mixed", { count: group.hrefs.length })}
          </span>
        )}
        <span className="text-xs text-surface-500">
          {t("links.activeCount", { active: group.activeCount, total })}
        </span>
      </div>
      <p className="mt-1 text-xs text-surface-500">
        {t("slot")}: <span className="font-mono">{group.slots.join(", ")}</span>
      </p>
      {group.asins.length > 0 && (
        <p className="mt-1 text-xs text-surface-500">
          ASIN: <span className="font-mono">{group.asins.join(", ")}</span>
          {" — "}
          {t("links.asinNote")}
        </p>
      )}
      {group.hrefCount > 0 && (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => setAdCreativeHrefByTitle(group.title, href));
          }}
        >
          <input
            type="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            aria-label={t("href")}
            placeholder="https://"
            maxLength={AD_CREATIVE_LIMITS.href}
            className={`min-w-60 flex-1 ${ADMIN_INPUT_CLASSES}`}
          />
          <button
            type="submit"
            disabled={isPending || href.trim() === ""}
            className={adminButtonClasses()}
          >
            {t("links.apply", { count: group.hrefCount })}
          </button>
        </form>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending || group.activeCount === total}
          onClick={() =>
            run(() => setAdCreativeActiveByTitle(group.title, true))
          }
          className={adminButtonClasses({ variant: "secondary" })}
        >
          {t("links.activate", { count: total })}
        </button>
        <button
          type="button"
          disabled={isPending || group.activeCount === 0}
          onClick={() =>
            run(() => setAdCreativeActiveByTitle(group.title, false))
          }
          className={adminButtonClasses({ variant: "secondary" })}
        >
          {t("links.deactivate", { count: total })}
        </button>
      </div>
    </li>
  );
}
