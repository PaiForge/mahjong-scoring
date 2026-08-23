import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { HighlightPanel } from "@/app/(user)/_components/highlight-panel";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@/app/(user)/(public)/preferences/_lib/anchors";

/**
 * 非表示設定中の案内
 * ランキング非表示の案内
 *
 * 自分でランキング非表示にしている間は自分の順位が出ない。黙って消えると
 * 「記録できていない」と読めてしまうため、設定によるものだと明示して
 * 設定ページへ戻す。
 *
 * 教本のコラムと同じ `HighlightPanel` に入れる。地の文ではなく「自分の設定に
 * ついての知らせ」なので、ランキングの表から浮かせて読ませる。
 *
 * 一覧と詳細の両方から使うため、周りとの余白は置き場所を知っている
 * 呼び出し側に任せる。
 */
export async function ViewerHiddenNote() {
  const t = await getTranslations("leaderboard");

  return (
    <HighlightPanel>
      <div className="text-center text-sm leading-relaxed text-surface-700">
        <p>{t("viewerHidden")}</p>
        <Link
          href={preferencesHref(PREFERENCE_ANCHORS.leaderboardVisibility)}
          className={`mt-1 inline-block text-xs font-semibold ${TEXT_LINK_CLASSES}`}
        >
          {t("viewerHiddenLink")}
        </Link>
      </div>
    </HighlightPanel>
  );
}
