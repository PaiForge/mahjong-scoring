"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { NAV_ITEMS } from "./_lib/nav-items";

const SCROLL_DEAD_ZONE = 10;

export function MobileTabBar() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const [isVisible, setIsVisible] = useState(true);
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

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-surface-200 bg-white/90 backdrop-blur-xl pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <ul className="flex items-center justify-around px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                  isActive
                    ? "text-primary-600"
                    : "text-surface-400 hover:text-surface-600"
                }`}
              >
                {item.icon}
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
