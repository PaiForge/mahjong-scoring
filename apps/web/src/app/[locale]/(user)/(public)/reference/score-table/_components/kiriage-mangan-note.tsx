import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import {
  DEFAULT_LOCALE,
  type SupportedLocale,
} from "@mahjong-scoring/features/i18n/locales";
import {
  PREFERENCE_ANCHORS,
  preferencesHref,
} from "@mahjong-scoring/features/settings/preference-anchors";

interface KiriageManganNoteProps {
  /** 表が切り上げ満貫ありで描かれているか */
  readonly enabled: boolean;
  /** 表を置いているページの言語 */
  readonly pageLocale: SupportedLocale;
}

/**
 * 切り上げ満貫の設定の脚注
 * 切り上げ満貫の注記
 *
 * 表の 30符4翻・60符3翻は設定次第で満貫になる。表だけを見てもどちらのルールで
 * 出ているか分からず、普段と違うルールで打つ人には「点数表が間違っている」と
 * 読めてしまうため、オン・オフどちらでも表の下に今の設定を出して設定ページの
 * 該当項目へ戻す。
 *
 * 警告ではなく表の読み方の補足なので、表の上のツモの注記と同じ淡い小さな文字に
 * する（以前は有効なときだけ `HighlightPanel` で浮かせていたが、常に出すと
 * 毎回目に付く囲みになるため脚注に改めた）。出すかどうかと周りとの余白は
 * 置き場所を知っている呼び出し側に任せる。
 *
 * 状態とリンクの間の区切りは辞書（`scoreTable.kiriageManganStatusSeparator`）から
 * 引く。日本語は中黒「・」、英語は中点「·」で、英語のページに日本語の約物を
 * 混ぜない（以前は「・」を直書きしていて、英語の点数表の本文に 1 文字だけ日本語が
 * 出ていた）。
 *
 * 設定ページは日本語だけで公開している。英語のページ（英語の点数表）からは
 * `/en` を付けずに日本語の設定ページへ素の `<a hrefLang="ja">` で向け、
 * 「日本語のみ」と添える（英語の存在しない URL を作らない）。ここは表の
 * 中の深い葉で公開状態の表（`locale-link-table.ts`）を受け取れないため、
 * 「既定の言語以外では設定ページは未公開」を前提に置き、その前提は
 * `kiriage-mangan-note.test.tsx` が公開状態のモジュールと突き合わせて守る
 * （設定ページを英語で公開したらテストが落ちて教える）。
 */
export function KiriageManganNote({
  enabled,
  pageLocale,
}: KiriageManganNoteProps) {
  const t = useTranslations("scoreTable");
  const tNav = useTranslations("nav");
  const crossLocale = pageLocale !== DEFAULT_LOCALE;
  const href = preferencesHref(PREFERENCE_ANCHORS.kiriageMangan);

  return (
    <p className="text-xs text-surface-500">
      {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      <span aria-hidden="true" className="mx-1.5">
        {t("kiriageManganStatusSeparator")}
      </span>
      {crossLocale ? (
        <>
          <a
            href={href}
            hrefLang={DEFAULT_LOCALE}
            className={TEXT_LINK_CLASSES}
          >
            {t("kiriageManganStatusLink")}
          </a>
          <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
        </>
      ) : (
        <Link href={href} className={TEXT_LINK_CLASSES}>
          {t("kiriageManganStatusLink")}
        </Link>
      )}
    </p>
  );
}
