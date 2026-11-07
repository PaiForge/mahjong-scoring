import { AuthNavItem } from "./auth-nav-item";
import { DeferredPrefetchLink } from "./deferred-prefetch-link";
import { BrandLogo } from "@/app/_components/brand-logo";
import { NavMenu } from "./nav-menu";
import { NotificationBell } from "./notification-bell";

/**
 * トップヘッダー。
 * blindfold-chess の Header を移植。左にハンバーガーメニュー＋ロゴ、右に通知のベルと
 * アカウント表示（ベルはログイン済みにだけ出る）。
 */
export function Header() {
  return (
    <header className="bg-card border-b border-panel">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <NavMenu />
            <DeferredPrefetchLink href="/" className="flex items-center">
              <BrandLogo size="md" />
            </DeferredPrefetchLink>
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
