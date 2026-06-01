import Link from "next/link";

import { AuthNavItem } from "./auth-nav-item";
import { BrandLogo } from "./brand-logo";
import { NavMenu } from "./nav-menu";

/**
 * トップヘッダー。
 * blindfold-chess の Header を移植。左にハンバーガーメニュー＋ロゴ、右にアカウント表示。
 */
export function Header() {
  return (
    <header className="bg-card border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <NavMenu />
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" />
            </Link>
          </div>

          <AuthNavItem />
        </div>
      </div>
    </header>
  );
}
