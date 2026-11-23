import Link from "next/link";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { JapaneseOnlyMark } from "@/app/[locale]/(user)/_components/locale-nav-link";
import { localizedHref, splitHref } from "@/i18n/public-path";
import { getTranslatedPublication } from "@/i18n/translated-publications";
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
 * 警告ではなく表の読み方の補足なので、表の上のツモの注記と同じ小さな文字に
 * する（以前は有効なときだけ `HighlightPanel` で浮かせていたが、常に出すと
 * 毎回目に付く囲みになるため脚注に改めた）。出すかどうかと周りとの余白は
 * 置き場所を知っている呼び出し側に任せる。
 *
 * 状態は左、設定ページへのリンクは右端に分けて置く。以前は「切り上げ満貫：なし・
 * 設定を変更」と中黒でつないで 1 行の文にしていたが、脚注の地の文とリンクが同じ灰で、
 * 中黒の並びが「なし」と「設定を変更」を同格の語に見せ、どこからがリンクか
 * 分からなかった。区切りの約物も要らなくなり、英語のページに日本語の約物が混ざる
 * 心配もなくなった。狭い幅で折り返すときも、リンクは丸ごと次の行へ落ちる。
 *
 * 状態の文字はリンクの灰（`muted-foreground`）と同じ色にせず、表の本文と同じ
 * `text-foreground` にする。ツモの注記と同じ淡い灰にしていたころは、押せない状態と
 * 押せるリンクが同じ色で並び、状態までリンクのように見えた。
 *
 * 設定ページへのリンクは、ページの言語で設定ページを公開しているかで決める。
 * 公開していればその言語の設定ページ（英語なら `/en/preferences#…`）へ
 * `next/link` で向ける。未公開なら `/en` を付けずに日本語の設定ページへ素の
 * `<a hrefLang="ja">` で向け、「日本語のみ」と添える（英語の存在しない URL を
 * 作らない）。ここは表の中の深い葉で、公開状態の表（`locale-link-table.ts`）を
 * 受け取れず、クライアントの木からも描かれる。そこで用語のモーダルの設定への導線と
 * 同じく、クライアントからも読める許可リスト（`translated-publications.ts`）を
 * 直接引く。以前は「既定の言語以外では設定ページは未公開」を前提に置いていたが、
 * 会員の画面と一緒に設定ページも英語で公開したので、公開状態から決める形に改めた。
 */
export function KiriageManganNote({
  enabled,
  pageLocale,
}: KiriageManganNoteProps) {
  const t = useTranslations("scoreTable");
  const tNav = useTranslations("nav");
  const path = preferencesHref(PREFERENCE_ANCHORS.kiriageMangan);
  const crossLocale =
    pageLocale !== DEFAULT_LOCALE &&
    getTranslatedPublication(splitHref(path).pathname, pageLocale) ===
      "unpublished";
  const href = crossLocale ? path : localizedHref(path, pageLocale);

  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs text-surface-500">
      <p className="text-foreground">
        {t("kiriageManganStatus", { state: enabled ? "on" : "off" })}
      </p>
      {crossLocale ? (
        <span>
          <a
            href={href}
            hrefLang={DEFAULT_LOCALE}
            className={TEXT_LINK_CLASSES}
          >
            {t("kiriageManganStatusLink")}
          </a>
          <JapaneseOnlyMark label={tNav("language.japaneseOnly")} />
        </span>
      ) : (
        <Link href={href} className={TEXT_LINK_CLASSES}>
          {t("kiriageManganStatusLink")}
        </Link>
      )}
    </div>
  );
}
