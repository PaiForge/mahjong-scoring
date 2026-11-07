"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";

import { useBodyScrollLock } from "@/app/_hooks/use-body-scroll-lock";
import { useIsClient } from "@/app/_hooks/use-is-client";
import { DRAWER_NAV_ITEMS, isNavItemActive } from "./_lib/nav-items";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { stripLocalePrefix } from "@/i18n/public-path";
import { resolveNavTarget, type LocaleLinks } from "./_lib/locale-links";
import { LanguageSwitcher } from "./language-switcher";
import { JapaneseOnlyMark, LocaleNavLink } from "./locale-nav-link";

/**
 * ハンバーガーメニュー（左スライドのドロワー）。
 * blindfold-chess の MobileMenu を移植。PC・モバイル共通のナビゲーションとして使用する。
 *
 * 項目の下に言語切替（`LanguageSwitcher`）を置く。狭い画面ではヘッダーに
 * 切替を出さないので、ここが常設の入口になる（JavaScript の無い閲覧者と
 * クローラーにはフッターの切替がある。ドロワーはマウント後にしか描かない）。
 *
 * 英語のページでは、英語版の無い項目を日本語のページへ素のリンクで向け、
 * 「日本語のみ」と添える（英語の存在しない URL を作らない。`resolveNavTarget`）。
 * 選択中の判定はロケール接頭辞を外したパスで行う。
 */
export function NavMenu({
  localeLinks,
}: {
  /** 今のページの言語と公開 href の表（ヘッダーがサーバーで作って渡す） */
  readonly localeLinks: LocaleLinks;
}) {
  const t = useTranslations("nav");
  const pathname = stripLocalePrefix(usePathname());
  const [isOpen, setIsOpen] = useState(false);
  // ドロワーの中のリンクを先読みしてよいか。ドロワーは閉じていても描画したままで、
  // `<Link>` の監視範囲（画面外 200px まで）に掛かるため、放っておくとページを開いた
  // 瞬間に 6 本の先読みが本文の描画と並んで走る。メニューを開きそうな操作
  // （ボタンへの pointerenter（ホバー・タッチ）と focus）か、開いた時点で解禁する。
  const [wantsPrefetch, setWantsPrefetch] = useState(false);
  const armPrefetch = () => setWantsPrefetch(true);
  const mounted = useIsClient();

  useBodyScrollLock(isOpen);

  return (
    <>
      {/* ハンバーガーボタン */}
      <button
        type="button"
        onClick={() => {
          armPrefetch();
          setIsOpen((prev) => !prev);
        }}
        onPointerEnter={armPrefetch}
        onFocus={armPrefetch}
        className={`rounded-lg p-1.5 text-foreground transition-colors hover:bg-surface-100 ${FOCUS_RING_CLASSES}`}
        aria-label={t("menu")}
        aria-expanded={isOpen}
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {mounted &&
        createPortal(
          <>
            {isOpen && (
              <div
                className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-sm"
                onClick={() => setIsOpen(false)}
              />
            )}

            <div
              className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-panel bg-card transition-transform duration-300 ease-in-out ${
                isOpen ? "translate-x-0 shadow-xl" : "-translate-x-full"
              }`}
            >
              <div className="flex h-14 items-center justify-between border-b border-panel px-4">
                <span className="text-lg font-bold text-foreground">
                  {t("menu")}
                </span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className={`rounded-lg p-1.5 text-foreground transition-colors hover:bg-surface-100 ${FOCUS_RING_CLASSES}`}
                  aria-label={t("close")}
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              <nav className="space-y-1 px-4 py-6">
                {DRAWER_NAV_ITEMS.map((item) => {
                  const isActive = isNavItemActive(pathname, item.href);
                  const target = resolveNavTarget(item.href, localeLinks);
                  return (
                    <LocaleNavLink
                      key={item.href}
                      navTarget={target}
                      linkKind="plain"
                      prefetch={wantsPrefetch ? undefined : false}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${FOCUS_RING_CLASSES} ${
                        isActive
                          ? "bg-selected-subtle text-foreground"
                          : "text-muted-foreground hover:bg-surface-100 hover:text-foreground"
                      }`}
                    >
                      {item.icon}
                      <span>
                        {t(item.labelKey)}
                        {target.crossLocale && (
                          <JapaneseOnlyMark
                            label={t("language.japaneseOnly")}
                          />
                        )}
                      </span>
                    </LocaleNavLink>
                  );
                })}
              </nav>

              <div className="space-y-2 border-t border-panel px-8 py-4">
                <p className="text-xs font-bold text-muted-foreground">
                  {t("language.label")}
                </p>
                <LanguageSwitcher localeLinks={localeLinks} variant="stacked" />
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
