import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import type { NavTarget } from "@/app/[locale]/(user)/_components/_lib/locale-links";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";

interface PracticeNavLinkProps {
  /** 張る先（サーバーは `resolveNavTargetFor`、クライアントは `clientNavTarget`） */
  readonly navTarget: NavTarget;
  readonly className?: string;
  readonly children: ReactNode;
}

/**
 * 練習の画面に置く、言語をまたぎうるテキストリンク
 * 練習のロケールリンク
 *
 * 行き先がその言語で公開していれば同じ言語の `next/link`、未公開（英語のページから
 * 登録・ログイン・料金・設定・マイレコードへ）なら素の `<a hrefLang="ja">` にして
 * 文書ごと読み込み、末尾に「日本語のみ」を添える。英語の文書の中で日本語のページへ
 * クライアント遷移すると `<html lang>` と辞書が切り替わらないため。
 *
 * `"use client"` は付けない。hooks は `useTranslations()` だけで、サーバーの部品からも
 * クライアントの盤面からも同じ形で使える。
 */
export function PracticeNavLink({
  navTarget,
  className,
  children,
}: PracticeNavLinkProps) {
  const t = useTranslations("nav.language");
  return (
    <LocaleNavLink navTarget={navTarget} linkKind="plain" className={className}>
      {children}
      {navTarget.crossLocale && <JapaneseOnlyMark label={t("japaneseOnly")} />}
    </LocaleNavLink>
  );
}
