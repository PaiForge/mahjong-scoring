import Link from "next/link";

import { AuthNavItem } from "./auth-nav-item";
import { BrandLogo } from "./brand-logo";
import { NavMenu } from "./nav-menu";
import { NotificationBell } from "./notification-bell";

/**
 * トップヘッダー。
 * blindfold-chess の Header を移植。左にハンバーガーメニュー＋ロゴ、右に通知のベルと
 * アカウント表示（ベルはログイン済みにだけ出る）。
 */
export function Header() {
  return (
    <header className="bg-card border-b-4 border-ink">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <NavMenu />
            <Link href="/" className="flex items-center">
              <BrandLogo size="md" />
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <AuthNavItem />
          </div>
        </div>
      </div>
    </header>
  );
}
