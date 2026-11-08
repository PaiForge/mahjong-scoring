import { getTranslations } from "next-intl/server";

import { AuthNavItem } from "./auth-nav-item";
import { BrandLogo } from "@/app/_components/brand-logo";
import { getLocaleLinks } from "./_lib/locale-link-table";
import { resolveNavTarget } from "./_lib/locale-links";
import { LanguageSwitcher } from "./language-switcher";
import { JapaneseOnlyMark, LocaleNavLink } from "./locale-nav-link";
import { NavMenu } from "./nav-menu";
import { NotificationBell } from "./notification-bell";

/**
 * トップヘッダー。
 * blindfold-chess の Header を移植。左にハンバーガーメニュー＋ロゴ、右に通知のベルと
 * アカウント表示（ベルはログイン済みにだけ出る）。
 *
 * @design 言語切替は md 以上の右端に常設する
 * デスクトップでは右端に「日本語 / English」を常に出す（狭い画面ではドロワーと
 * フッターが持つ）。切替は通常のリンクで、自動の転送や言語の提案はしない
 * （`LanguageSwitcher`）。置き場所を右端にしているのは、アカウント表示が
 * 読み込み中のスケルトンからログイン導線・アバターへ幅を変えても、切替の
 * 位置が動かないようにするため（右端が固定で、変わる幅は左へ伸び縮みする）。
 * 切替自体の幅はページや言語で変わらない。
 *
 * 英語のページでは、ロゴ（トップ）は英語版が無いので日本語のトップへ素の
 * リンクで向け、読み上げで「日本語のみ」と添える（ロゴの横に文字を足す
 * 余地は無い）。
 */
export async function Header() {
  const localeLinks = await getLocaleLinks();
  const t = await getTranslations("nav");
  const homeTarget = resolveNavTarget("/", localeLinks);

  return (
    <header className="bg-card border-b border-panel">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <NavMenu localeLinks={localeLinks} />
            <LocaleNavLink
              navTarget={homeTarget}
              linkKind="deferred"
              className="flex items-center"
            >
              <BrandLogo size="md" />
              {homeTarget.crossLocale && (
                <JapaneseOnlyMark
                  label={t("language.japaneseOnly")}
                  visuallyHidden
                />
              )}
            </LocaleNavLink>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell localeLinks={localeLinks} />
            <AuthNavItem localeLinks={localeLinks} />
            <div className="hidden border-l border-panel pl-3 md:block">
              <LanguageSwitcher localeLinks={localeLinks} variant="inline" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
