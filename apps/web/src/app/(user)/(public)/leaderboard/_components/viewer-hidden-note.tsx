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
 * 文言は設定ページのトグル名（「ランキングに表示しない」）をそのまま引く。
 * どの項目を変えればいいかがリンクを押す前に読めるうえ、順位が出ていない
 * 理由も同じ一言で足りる。折り返さない長さ（狭い端末で 15 文字ほど）に
 * 保つこと — 琥珀色の囲みが 2 行になると、順位表よりこの箱の方が目立つ。
 *
 * 教本のコラムと同じ `HighlightPanel` に入れる。地の文ではなく「自分の設定に
 * ついての知らせ」なので、ランキングの表から浮かせて読ませる。
 *
 * 出すのは順位が出ない土俵の表（詳細ページ）だけ。一覧にも並べると同じ
 * 知らせを二度読ませることになる。
 *
 * 周りとの余白は置き場所を知っている呼び出し側に任せる。
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
