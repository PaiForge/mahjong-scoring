"use client";

import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useIsOverlayOpen } from "@/app/_hooks/use-body-scroll-lock";
import { TAB_BAR_NAV_ITEMS, isNavItemActive } from "./_lib/nav-items";
import { isSessionRoute } from "@/app/_components/_lib/session-routes";
import { DeferredPrefetchLink } from "./deferred-prefetch-link";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { stripLocalePrefix } from "@/i18n/public-path";
import { resolveNavTarget, type LocaleLinks } from "./_lib/locale-links";

const SCROLL_DEAD_ZONE = 10;

/**
 * モバイル下部のタブバー（クライアント側の本体）
 * タブバー
 *
 * 選択中の判定・セッション中の判定は、ロケール接頭辞を外したパス
 * （`/en/reference/score-table` → `/reference/score-table`）で行う。既存の
 * ルートの判定はロケール非依存のパスを前提に書かれているため。
 *
 * 英語のページでは、英語版の無いタブを出さない。5 つ並ぶタブには
 * 「日本語のみ」と添える幅が無く、英語の名前のまま日本語のページへ
 * 飛ばすと行き先の言語を偽ることになるため（ドロワーには「日本語のみ」と
 * 添えて残す）。残るタブが 1 つ以下ならタブバーごと出さない — 行き先が
 * 今のページしか無いバーは画面の下端を塞ぐだけになる。日本語のページでは
 * 全タブを今までどおり出す。
 */
export function MobileTabBarView({
  localeLinks,
}: {
  /** 今のページの言語と公開 href の表（`MobileTabBar` がサーバーで作って渡す） */
  readonly localeLinks: LocaleLinks;
}) {
  const pathname = stripLocalePrefix(usePathname());
  const t = useTranslations("nav");
  const [isVisible, setIsVisible] = useState(true);
  const isOverlayOpen = useIsOverlayOpen();
  const lastScrollY = useRef(0);

  const handleScroll = useCallback(() => {
    const currentScrollY = window.scrollY;
    const diff = currentScrollY - lastScrollY.current;

    if (diff > SCROLL_DEAD_ZONE) {
      setIsVisible(false);
    } else if (diff < -SCROLL_DEAD_ZONE) {
      setIsVisible(true);
    }

    lastScrollY.current = currentScrollY;
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // 出題セッション中は上スクロールで迫り出してくるタブバーが解答の邪魔になるため、
  // 下端のスペーサーごと畳んで画面をセッションに明け渡す。
  if (isSessionRoute(pathname)) {
    return undefined;
  }

  const items = TAB_BAR_NAV_ITEMS.flatMap((item) => {
    const target = resolveNavTarget(item.href, localeLinks);
    return target.crossLocale ? [] : [{ item, href: target.href }];
  });
  if (items.length < 2) {
    return undefined;
  }

  return (
    <>
      {/* 固定の nav がフッターを覆わないようにするスペーサー。
          背景を敷かず、main と同じ body の下地を見せる。 */}
      <div className="h-14 md:h-0" />
      {/* モーダル・ドロワーが開いている間は display:none で引っ込める。
          オーバーレイ（bg-black/50）は半透明なので、不透明なタブバーが下に
          残っていると薄まった帯として透け、下端だけ覆えていないように見える。
          z-index はすでにオーバーレイ（z-50）が上なので上げても直らない。
          スペーサーは残す — 高さが変わると背面の本文が動いて透けて見えるため。 */}
      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 border-t border-panel bg-card pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
          isOverlayOpen ? "hidden" : "md:hidden"
        } ${isVisible ? "translate-y-0" : "translate-y-full"}`}
      >
        <ul className="flex items-stretch px-2 py-1">
          {items.map(({ item, href }) => {
            const isActive = isNavItemActive(pathname, item.href);
            return (
              <li key={item.href} className="flex-1">
                <DeferredPrefetchLink
                  href={href}
                  className={`flex w-full flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs transition-colors ${FOCUS_RING_CLASSES} ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.icon}
                  <span>{t(item.labelKey)}</span>
                </DeferredPrefetchLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
