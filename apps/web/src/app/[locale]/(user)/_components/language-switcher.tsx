"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

import {
  languageOptions,
  type LanguageOption,
  type LocaleLinks,
} from "./_lib/locale-links";

/** 言語の名前の辞書キー（各言語を自国語名で示す。どの言語の辞書でも同じ表記） */
const LANGUAGE_NAME_KEYS = {
  ja: "language.ja",
  en: "language.en",
} as const satisfies Record<SupportedLocale, string>;

interface LanguageSwitcherProps {
  readonly localeLinks: LocaleLinks;
  /**
   * 見せ方。`"inline"` はヘッダーの 1 行（対訳が無いことは読み上げと title
   * だけで示す）、`"stacked"` はドロワーとフッター（対訳が無いことを文字で
   * 下に添える）。見出し（「言語」）は置き場所の側が持つ
   */
  readonly variant: "inline" | "stacked";
}

/**
 * 言語切替（日本語 / English）
 * 言語切替
 *
 * @design 手動の切替を通常のリンクで出す。自動の転送・案内はしない
 * 今のページに対訳があれば、その対訳への素の `<a href hrefLang>` を出す。
 * JavaScript が無くても移動でき、クローラーもリンクとして辿れる。言語は
 * URL だけで決まり、cookie・`Accept-Language`・`navigator.languages` で
 * 推測した言語へ転送も提案もしない（同じ URL が閲覧者ごとに別の内容や
 * 転送先を返すと、クローラーの見る内容と食い違う）。選んだ言語は保存しない
 * — リンクの行き先そのものが選択で、保存できなくても切替は動く。
 *
 * 対訳の無いページでは、その言語をリンクにせず「このページの英語版は
 * ありません」と示す。英語の LP や別の英語ページへ勝手に向けない。
 *
 * `next/link` ではなく素の `<a>` にしているのは、言語をまたぐ遷移を文書の
 * 読み込みにするため。`<html lang>` はルートレイアウトが、辞書は Provider が
 * 文書の読み込み時に決めるので、クライアント遷移では切り替わらない。先読みも
 * 走らない（常設のリンクの先読みの規約に触れない）。
 *
 * @design 幅と並びを予約する
 * 選択肢は対応言語の定義順に常に全部出し、今の言語・リンク・対訳なしの
 * どれでも同じ語（自国語名）を同じ位置に置く。ページや読み込みの段階で
 * 幅が変わらないため、隣の要素を押しのけない（CLS を出さない）。本文の上に
 * 案内の帯や大きな overlay を出す方式は採らない。
 *
 * query は `variant` や点数表の注目セルだけを引き継ぐ（許可リストは
 * `locale-links.ts`）。`useSearchParams()` は静的なページでは最も近い
 * Suspense までをクライアント描画に切り替えるので、query を読む葉だけを
 * Suspense に入れ、初期 HTML には query 無しの同じリンクを出しておく。
 */
export function LanguageSwitcher({
  localeLinks,
  variant,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  return (
    <Suspense
      fallback={
        <LanguageSwitcherView
          options={languageOptions(pathname, "", localeLinks)}
          variant={variant}
        />
      }
    >
      <LanguageSwitcherWithQuery
        pathname={pathname}
        localeLinks={localeLinks}
        variant={variant}
      />
    </Suspense>
  );
}

/** 今の query を読んで切替リンクに引き継ぐ葉（Suspense の内側） */
function LanguageSwitcherWithQuery({
  pathname,
  localeLinks,
  variant,
}: {
  readonly pathname: string;
  readonly localeLinks: LocaleLinks;
  readonly variant: LanguageSwitcherProps["variant"];
}) {
  const search = useSearchParams().toString();
  return (
    <LanguageSwitcherView
      options={languageOptions(pathname, search, localeLinks)}
      variant={variant}
    />
  );
}

function LanguageSwitcherView({
  options,
  variant,
}: {
  readonly options: readonly LanguageOption[];
  readonly variant: LanguageSwitcherProps["variant"];
}) {
  const t = useTranslations("nav");
  // 対訳が無いことの文言は英語の分だけ持つ（日本語は全ページにある）
  const englishUnavailable = options.some(
    (option) => option.kind === "unavailable" && option.locale === "en",
  );
  const unavailableNote = t("language.enUnavailable");

  return (
    <div
      role="group"
      aria-label={t("language.label")}
      className={variant === "inline" ? "text-xs" : "space-y-1 text-sm"}
    >
      <ul className="flex items-center gap-1.5 whitespace-nowrap">
        {options.map((option, index) => (
          <li key={option.locale} className="flex items-center gap-1.5">
            {index > 0 && (
              <span aria-hidden="true" className="text-surface-300">
                /
              </span>
            )}
            <LanguageOptionItem
              option={option}
              name={t(LANGUAGE_NAME_KEYS[option.locale])}
              unavailableNote={
                option.locale === "en" && variant === "inline"
                  ? unavailableNote
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
      {variant === "stacked" && englishUnavailable && (
        <p className="text-xs text-muted-foreground">{unavailableNote}</p>
      )}
    </div>
  );
}

function LanguageOptionItem({
  option,
  name,
  unavailableNote,
}: {
  readonly option: LanguageOption;
  readonly name: string;
  /** 対訳が無いことを読み上げと title で添える文言（inline のときだけ） */
  readonly unavailableNote: string | undefined;
}) {
  switch (option.kind) {
    case "current":
      return (
        <span
          lang={option.locale}
          aria-current="true"
          className="font-bold text-foreground"
        >
          {name}
        </span>
      );
    case "link":
      return (
        <a
          href={option.href}
          hrefLang={option.locale}
          lang={option.locale}
          className={TEXT_LINK_CLASSES}
        >
          {name}
        </a>
      );
    case "unavailable":
      // 言語名はその言語の表記、添える文言は今のページの言語なので lang を分ける
      return (
        <span title={unavailableNote} className="text-surface-400">
          <span lang={option.locale}>{name}</span>
          {unavailableNote !== undefined && (
            <span className="sr-only">{` ${unavailableNote}`}</span>
          )}
        </span>
      );
  }
}
