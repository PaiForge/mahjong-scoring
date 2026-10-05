import Link from "next/link";

import type { PreferenceAnchor } from "@/app/(user)/(public)/preferences/_lib/anchors";
import { preferencesHref } from "@/app/(user)/(public)/preferences/_lib/anchors";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

import type { GuideTranslator } from "../_lib/guide-translator";
import { GuideNote } from "./guide-note";

interface PreferenceSettingsNoteProps {
  /** 章の名前空間で解決済みの翻訳関数 */
  readonly t: GuideTranslator;
  /** 設定ページで開く項目のアンカー（`PREFERENCE_ANCHORS` の値） */
  readonly anchor: PreferenceAnchor;
}

/**
 * 設定で切り替えられるルールの注記
 * 設定誘導注記
 *
 * 章の辞書が `columnSettingsNote`（`<settingsLink>` を含む）を持つ前提で、
 * 該当の設定項目へのリンク入りの注記を出す。ルールが端末の設定で変わる章
 * （連風牌・切り上げ満貫）が使う。
 */
export function PreferenceSettingsNote({
  t,
  anchor,
}: PreferenceSettingsNoteProps) {
  return (
    <GuideNote>
      {t.rich("columnSettingsNote", {
        settingsLink: (chunks) => (
          <Link href={preferencesHref(anchor)} className={TEXT_LINK_CLASSES}>
            {chunks}
          </Link>
        ),
      })}
    </GuideNote>
  );
}
