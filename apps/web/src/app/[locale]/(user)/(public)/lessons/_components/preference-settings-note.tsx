import { getLocale, getTranslations } from "next-intl/server";

import type { PreferenceAnchor } from "@mahjong-scoring/features/settings/preference-anchors";
import { preferencesHref } from "@mahjong-scoring/features/settings/preference-anchors";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";

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
 *
 * 設定ページへのリンクはページの言語で解決する（`resolveNavTargetFor`）。
 * 設定ページがその言語で出ていなければ（英語の章の間は日本語だけ）、日本語の
 * 設定ページへ「日本語のみ」の印付きで張り、英語の存在しない URL を作らない。
 * 言語は `getLocale()` で取る — 章本文の部品の中から描かれ、言語を props で
 * 渡す経路が無いため。ページの入口（`prepareRouteLocale`）が先に
 * `setRequestLocale` を済ませているので headers を読まず、静的生成を壊さない。
 */
export async function PreferenceSettingsNote({
  t,
  anchor,
}: PreferenceSettingsNoteProps) {
  const [tNav, locale] = await Promise.all([
    getTranslations("nav.language"),
    getLocale(),
  ]);
  const target = resolveNavTargetFor(preferencesHref(anchor), locale);

  return (
    <GuideNote>
      {t.rich("columnSettingsNote", {
        settingsLink: (chunks) => (
          <>
            <LocaleNavLink
              navTarget={target}
              linkKind="plain"
              className={TEXT_LINK_CLASSES}
            >
              {chunks}
            </LocaleNavLink>
            {target.crossLocale && (
              <JapaneseOnlyMark label={tNav("japaneseOnly")} />
            )}
          </>
        ),
      })}
    </GuideNote>
  );
}
