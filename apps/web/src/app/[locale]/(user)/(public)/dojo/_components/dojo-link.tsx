import type { ComponentProps, ReactNode } from "react";

import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";

/**
 * 道場の部品がリンクを張るページの言語
 * 道場リンクの言語
 *
 * 級の見出し・進み具合は呼び出し側のテストが 1 段だけ await して描く同期の
 * 部品で、自分で言語を取れない（`currentLocale()` は async）。言語と
 * 「日本語のみ」の文言を 1 組にして呼び出し側から受け取る。省略した呼び出し
 * （ダッシュボードのように日本語だけで出している画面）は日本語のページと
 * 同じリンクになる。
 */
export interface DojoLinkLocale {
  /** リンクを置くページの言語 */
  readonly locale: SupportedLocale;
  /** 言語をまたぐリンクに添える「日本語のみ」（`nav.language.japaneseOnly`） */
  readonly japaneseOnlyLabel: string;
}

/**
 * 道場の部品のリンク先を、ページの言語で張る先に解決する
 * 道場リンク先解決
 *
 * `linkLocale` が無ければ入力のまま（日本語のページの href）。あれば
 * `resolveNavTargetFor` — その言語で公開していればその言語の href、
 * 未公開なら日本語の href のまま `crossLocale`。
 *
 * @param path - ロケール非依存の href（query・hash を含んでよい）
 * @param linkLocale - リンクを置くページの言語（省略時は日本語）
 */
export function dojoNavTarget(
  path: string,
  linkLocale: DojoLinkLocale | undefined,
): NavTarget {
  return linkLocale === undefined
    ? { href: path, crossLocale: false }
    : resolveNavTargetFor(path, linkLocale.locale);
}

type AnchorProps = Omit<ComponentProps<"a">, "href" | "hrefLang" | "children">;

interface DojoLinkProps extends AnchorProps {
  /** ロケール非依存の href */
  readonly path: string;
  readonly linkLocale: DojoLinkLocale | undefined;
  readonly children: ReactNode;
}

/**
 * 道場の部品のテキストリンク
 * 道場リンク
 *
 * 同じ言語の行き先は `next/link`（今までと同じ要素）、言語をまたぐ行き先は
 * 素の `<a hrefLang="ja">` と「日本語のみ」の印（クライアント遷移で言語を
 * またぐと、英語の文書に日本語の本文が載る。`LocaleNavLink` の TSDoc）。
 */
export function DojoLink({
  path,
  linkLocale,
  children,
  ...props
}: DojoLinkProps) {
  const target = dojoNavTarget(path, linkLocale);
  return (
    <LocaleNavLink navTarget={target} linkKind="plain" {...props}>
      {children}
      {target.crossLocale && linkLocale !== undefined && (
        <JapaneseOnlyMark label={linkLocale.japaneseOnlyLabel} />
      )}
    </LocaleNavLink>
  );
}
