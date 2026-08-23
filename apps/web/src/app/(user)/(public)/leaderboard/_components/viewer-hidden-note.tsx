import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@/app/(user)/(public)/preferences/_lib/anchors";

/**
 * 非表示設定中の案内
 * ランキング非表示の案内
 *
 * 自分でランキング非表示にしている間は自分の順位行が出ない。黙って消えると
 * 「記録できていない」と読めてしまうため、設定によるものだと明示して
 * 設定ページへ戻す。
 */
export async function ViewerHiddenNote() {
  const t = await getTranslations("leaderboard");

  return (
    <div className="mt-2 border-t-2 border-surface-200 pt-3 text-center text-sm text-surface-500">
      <p>{t("viewerHidden")}</p>
      <Link
        href={preferencesHref(PREFERENCE_ANCHORS.leaderboardVisibility)}
        className={`mt-1 inline-block text-xs font-semibold ${TEXT_LINK_CLASSES}`}
      >
        {t("viewerHiddenLink")}
      </Link>
    </div>
  );
}
