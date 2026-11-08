import type { ComponentProps, ReactNode } from "react";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@mahjong-scoring/features/i18n/locales";

import {
  BUTTON_CONTENT_CLASSES,
  buttonClasses,
  type ButtonSize,
  type ButtonVariant,
} from "./_lib/button-classes";
import type { NavTarget } from "./_lib/locale-links";
import { LinkPending, LinkPendingOverlay } from "./link-pending";

interface LinkButtonOwnProps {
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  /** 親要素の幅いっぱいに広げる */
  readonly fullWidth?: boolean;
  /**
   * ラベルの右端に置くアイコン（チェブロン等）。
   * 遷移待ち中はこのスロット自体がスピナーへ差し替わる。
   *
   * 指定しない場合、遷移待ち中は中身を隠してボタン中央にスピナーを出す。
   */
  readonly trailingIcon?: ReactNode;
  /**
   * 遷移できない状態。
   *
   * リンクではなく `aria-disabled` を付けた `<span>` を描画する
   * （href を残したまま無効に見せると押せてしまうため）。
   */
  readonly disabled?: boolean;
}

/** 同じ言語の中の遷移。`next/link` の props をそのまま受ける */
type HrefLinkButtonProps = ComponentProps<typeof Link> & {
  readonly navTarget?: undefined;
};

/**
 * 張る先を `resolveNavTargetFor()` / `resolveNavTarget()` の結果で受ける形。
 * 言語をまたぐ（`crossLocale`）と素の `<a>` になるため、`next/link` だけが
 * 読む props（`prefetch` 等）は受けない
 */
type NavTargetLinkButtonProps = Omit<
  ComponentProps<"a">,
  "href" | "hrefLang"
> & {
  /** 今のページの言語で張る先 */
  readonly navTarget: NavTarget;
  readonly href?: undefined;
};

type LinkButtonProps = LinkButtonOwnProps &
  (HrefLinkButtonProps | NavTargetLinkButtonProps);

/**
 * リンクのボタン
 *
 * 見た目は `Button` と共通（`buttonClasses`）で、要素だけが `next/link`。
 * クリック後の遷移待ち中はボタン中央にスピナーを表示する
 * （`trailingIcon` があるときはそのスロットを差し替える）。
 *
 * アイコン + ラベルの間隔はコンポーネント側が持つため、
 * 呼び出し側の `className` に `gap-*` を書かない。
 *
 * @design 言語をまたぐ遷移は素の `<a hrefLang="ja">`
 * `href` の代わりに `navTarget` を渡すと、`crossLocale` のとき（英語のページから
 * 英語版の無い日本語のページへ）は `next/link` ではなく素の `<a hrefLang="ja">` を
 * 描き、文書ごと読み込む。`<html lang>` はルートレイアウトが、辞書は Provider が
 * 文書の読み込み時に決めるため、クライアント遷移で言語をまたぐと英語の文書に
 * 日本語の本文が載る（`LocaleNavLink` と同じ理由）。素の `<a>` には
 * `useLinkStatus` の遷移待ちが無いので、この形ではスピナーを出さない（文書の
 * 読み込みはブラウザ自身が示す）。見た目（クラス・中身の包み方）は `next/link`
 * の待機していない状態と同じにし、言語で幅や位置を変えない。
 * 「日本語のみ」の印（`JapaneseOnlyMark`）は呼び出し側が `children` に置く。
 * `crossLocale` でない `navTarget` は `href={navTarget.href}` と同じ。
 */
export function LinkButton({
  variant,
  size,
  fullWidth,
  disabled = false,
  className,
  children,
  trailingIcon,
  ...props
}: Readonly<LinkButtonProps>) {
  const classes =
    `${buttonClasses({ variant, size, fullWidth, disabled })} ${className ?? ""}`.trim();

  if (disabled) {
    return (
      <span aria-disabled="true" className={classes}>
        <span className={BUTTON_CONTENT_CLASSES}>{children}</span>
        {trailingIcon ? (
          <span className="flex size-5 shrink-0 items-center justify-center">
            {trailingIcon}
          </span>
        ) : undefined}
      </span>
    );
  }

  if (props.navTarget !== undefined) {
    const { navTarget, href: _href, ...anchorProps } = props;
    if (navTarget.crossLocale) {
      if (trailingIcon) {
        return (
          <a
            href={navTarget.href}
            hrefLang={DEFAULT_LOCALE}
            className={classes}
            {...anchorProps}
          >
            {children}
            <span className="flex size-5 shrink-0 items-center justify-center">
              {trailingIcon}
            </span>
          </a>
        );
      }
      return (
        <a
          href={navTarget.href}
          hrefLang={DEFAULT_LOCALE}
          className={`relative ${classes}`}
          {...anchorProps}
        >
          <span className={BUTTON_CONTENT_CLASSES}>{children}</span>
        </a>
      );
    }
    return (
      <LinkButtonLink
        classes={classes}
        trailingIcon={trailingIcon}
        linkProps={{ ...anchorProps, href: navTarget.href }}
      >
        {children}
      </LinkButtonLink>
    );
  }

  const { navTarget: _navTarget, ...linkProps } = props;
  return (
    <LinkButtonLink
      classes={classes}
      trailingIcon={trailingIcon}
      linkProps={linkProps}
    >
      {children}
    </LinkButtonLink>
  );
}

/** `next/link` で描く LinkButton（遷移待ちのスピナー付き） */
function LinkButtonLink({
  classes,
  trailingIcon,
  linkProps,
  children,
}: {
  readonly classes: string;
  readonly trailingIcon: ReactNode;
  readonly linkProps: ComponentProps<typeof Link>;
  readonly children: ReactNode;
}) {
  if (trailingIcon) {
    return (
      <Link className={classes} {...linkProps}>
        {children}
        <span className="flex size-5 shrink-0 items-center justify-center">
          {/* スピナーの色は border-current 経由でボタンの文字色を継ぐ */}
          <LinkPending spinnerClassName="size-4">{trailingIcon}</LinkPending>
        </span>
      </Link>
    );
  }

  return (
    <Link className={`relative ${classes}`} {...linkProps}>
      <LinkPendingOverlay>{children}</LinkPendingOverlay>
    </Link>
  );
}
