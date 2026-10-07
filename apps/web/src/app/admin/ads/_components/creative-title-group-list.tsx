"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import { useAdsAction } from "../_hooks/use-ads-action";
import { setAdCreativeActiveByTitle } from "../_actions/set-ad-creative-active-by-title";
import { setAdCreativeHrefByTitle } from "../_actions/set-ad-creative-href-by-title";
import type {
  CreativeTitleGroup,
  CreativeTitleGroupSide,
} from "../_lib/title-groups";
import { AD_CREATIVE_LIMITS } from "../_lib/validation";
import { adminChipClasses } from "../../_lib/chip-classes";
import { adminButtonClasses } from "../../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../../_lib/input-classes";

interface Props {
  readonly groups: readonly CreativeTitleGroup[];
}

/**
 * タイトル別のまとまりの一覧。1 まとまり（1 冊の本）に、両方まとめて
 * 掲載 / 停止するボタンと、web・アプリそれぞれの行（リンク欄とその側だけの
 * 掲載 / 停止）を持つ
 * タイトル別一括更新一覧
 *
 * ASIN で指す本（Amazon）はリンクをトラッキング ID と組み立てるため、
 * リンク欄を出さず ASIN を示すだけにする。リンク欄は URL を持つ行がある
 * 側にだけ出す。リンクは両方まとめては貼らない（`CreativeTitleGroup` 参照）。
 *
 * リンク欄はその側の全行が同じリンクのときだけ、そのリンクで始める（済んで
 * いる本が済んでいると読める）。揃っていなければ空欄で始め、「リンクが
 * 揃っていない」と示す — スロットごとにトラッキング ID を変えている本を、
 * うっかり 1 つのリンクで上書きしないため。
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

type AppliedResult = { readonly error: string } | { readonly updated: number };

/** 一括更新を実行し、更新した件数をトーストに出す */
function useApply() {
  const t = useTranslations("admin.ads.links");
  const { isPending, run } = useAdsAction();
  const apply = (action: () => Promise<AppliedResult>) => {
    run(action, (result) => {
      toast.success(t("applied", { count: result.updated }));
    });
  };
  return { isPending, apply };
}

function CreativeTitleGroupRow({
  group,
}: {
  readonly group: CreativeTitleGroup;
}) {
  const t = useTranslations("admin.ads.links");
  const { isPending, apply } = useApply();
  const { title, total, activeCount, sides } = group;

  return (
    <li className="rounded-lg border border-surface-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-surface-900">{title}</span>
        <span className="text-xs text-surface-500">
          {t("activeCount", { active: activeCount, total })}
        </span>
      </div>
      {sides.length > 1 && (
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || activeCount === total}
            onClick={() => apply(() => setAdCreativeActiveByTitle(title, true))}
            className={adminButtonClasses({ variant: "secondary", size: "sm" })}
          >
            {t("activateAll", { count: total })}
          </button>
          <button
            type="button"
            disabled={isPending || activeCount === 0}
            onClick={() =>
              apply(() => setAdCreativeActiveByTitle(title, false))
            }
            className={adminButtonClasses({ variant: "secondary", size: "sm" })}
          >
            {t("deactivateAll", { count: total })}
          </button>
        </div>
      )}
      <div className="mt-3 divide-y divide-surface-200 rounded-md border border-surface-200">
        {sides.map((side) => (
          <CreativeTitleGroupSideRow
            key={side.platform}
            title={title}
            side={side}
          />
        ))}
      </div>
    </li>
  );
}

function CreativeTitleGroupSideRow({
  title,
  side,
}: {
  readonly title: string;
  readonly side: CreativeTitleGroupSide;
}) {
  const t = useTranslations("admin.ads");
  const agreed = side.hrefs.length === 1 ? (side.hrefs[0] ?? "") : "";
  const [href, setHref] = useState(agreed);
  const { isPending, apply } = useApply();
  const { platform, total } = side;

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={adminChipClasses("neutral")}>
          {t(`platforms.${platform}`)}
        </span>
        {side.hrefs.length > 1 && (
          <span className={adminChipClasses("warning")}>
            {t("links.mixed", { count: side.hrefs.length })}
          </span>
        )}
        <span className="text-xs text-surface-500">
          {t("links.activeCount", { active: side.activeCount, total })}
        </span>
      </div>
      <p className="mt-1 text-xs text-surface-500">
        {t("slot")}: <span className="font-mono">{side.slots.join(", ")}</span>
      </p>
      {side.asins.length > 0 && (
        <p className="mt-1 text-xs text-surface-500">
          ASIN: <span className="font-mono">{side.asins.join(", ")}</span>
          {" — "}
          {t(`links.asinNote.${platform}`)}
        </p>
      )}
      {side.hrefCount > 0 && (
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            apply(() => setAdCreativeHrefByTitle(title, platform, href));
          }}
        >
          <input
            type="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            aria-label={`${t(`platforms.${platform}`)} ${t("href")}`}
            placeholder="https://"
            maxLength={AD_CREATIVE_LIMITS.href}
            className={`min-w-60 flex-1 ${ADMIN_INPUT_CLASSES}`}
          />
          <button
            type="submit"
            disabled={isPending || href.trim() === ""}
            className={adminButtonClasses()}
          >
            {t("links.apply", { count: side.hrefCount })}
          </button>
        </form>
      )}
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={isPending || side.activeCount === total}
          onClick={() =>
            apply(() => setAdCreativeActiveByTitle(title, true, platform))
          }
          className={adminButtonClasses({ variant: "secondary", size: "sm" })}
        >
          {t("links.activate", { count: total })}
        </button>
        <button
          type="button"
          disabled={isPending || side.activeCount === 0}
          onClick={() =>
            apply(() => setAdCreativeActiveByTitle(title, false, platform))
          }
          className={adminButtonClasses({ variant: "secondary", size: "sm" })}
        >
          {t("links.deactivate", { count: total })}
        </button>
      </div>
    </div>
  );
}
