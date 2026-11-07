import Link from "next/link";
import type { ComponentProps } from "react";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import type { NavTarget } from "./_lib/locale-links";
import { DeferredPrefetchLink } from "./deferred-prefetch-link";

type AnchorProps = Omit<ComponentProps<"a">, "href" | "hrefLang">;

interface LocaleNavLinkProps extends AnchorProps {
  /** `resolveNavTarget()` が返した張る先 */
  readonly navTarget: NavTarget;
  /**
   * 同じ言語の遷移に使うリンク。常設のリンク（ヘッダー・タブバー）は
   * `"deferred"`（`DeferredPrefetchLink`）、それ以外は `"plain"`（`next/link`）
   */
  readonly linkKind: "deferred" | "plain";
  /** 同じ言語の遷移の `prefetch`（閉じたドロワーが開くまで `false` を渡す） */
  readonly prefetch?: false;
}

/**
 * 今のページの言語に合わせたナビゲーションのリンク
 * ロケールナビリンク
 *
 * 同じ言語の遷移は今までどおり `next/link`（先読みの規約もそのまま）。
 * 言語をまたぐ遷移（英語のページから日本語だけのページへ）は素の
 * `<a hrefLang="ja">` にして文書ごと読み込む。`<html lang>` はルート
 * レイアウトが、辞書は Provider が文書の読み込み時に決めるので、クライアント
 * 遷移で言語をまたぐと英語の文書に日本語の本文が載る（逆も）。先読みも
 * 走らせない（英語のページで日本語のページを先読みしても使われにくい）。
 *
 * 言語をまたぐときに「日本語のみ」と示すのは呼び出し側（{@link JapaneseOnlyMark}）。
 * 置き場所ごとに見せ方（文字で添える / 読み上げだけ）が違うため。
 */
export function LocaleNavLink({
  navTarget: target,
  linkKind,
  prefetch,
  ...props
}: LocaleNavLinkProps) {
  if (target.crossLocale) {
    return <a href={target.href} hrefLang={DEFAULT_LOCALE} {...props} />;
  }
  if (linkKind === "deferred") {
    return (
      <DeferredPrefetchLink href={target.href} prefetch={prefetch} {...props} />
    );
  }
  return <Link href={target.href} prefetch={prefetch} {...props} />;
}

/**
 * 「日本語のみ」の印
 * 日本語のみ表示
 *
 * 英語のページから英語版の無いページへ張るリンクに添える。英語の存在しない
 * URL を作らず、既存の日本語のページへ向けていることを明示するため。
 * 文言（`nav.language.japaneseOnly`）は呼び出し側で引いて渡す
 * （サーバーとクライアントの両方から使うため）。
 *
 * @param label - 「日本語のみ」の文言
 * @param visuallyHidden - 読み上げだけにする（ロゴのように文字を添える余地が
 * 無い場所）
 */
export function JapaneseOnlyMark({
  label,
  visuallyHidden = false,
}: {
  readonly label: string;
  readonly visuallyHidden?: boolean;
}) {
  if (visuallyHidden) return <span className="sr-only">{` ${label}`}</span>;
  return (
    <span className="ml-1.5 inline-block rounded-md bg-surface-100 px-1.5 py-px text-[0.625rem] font-medium whitespace-nowrap text-muted-foreground no-underline">
      {label}
    </span>
  );
}
