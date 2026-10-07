import { BeltIcon } from "../icons/belt-icon";
import { HomeIcon } from "../icons/home-icon";
import { DumbbellIcon } from "../icons/dumbbell-icon";
import { BookIcon } from "../icons/book-icon";
import { TableIcon } from "../icons/table-icon";
import { ChartIcon } from "../icons/chart-icon";
import { SettingsIcon } from "../icons/settings-icon";

/**
 * ナビゲーション項目の定義
 * ナビゲーション項目
 */
export interface NavItemDef {
  readonly href: string;
  readonly labelKey: string;
  readonly icon: React.ReactNode;
}

/**
 * モバイル下部タブバー用のナビゲーション項目。
 * タブバーは主要コンテンツへの導線に絞るため、設定は含めない。
 * ランキングも含めない — 毎日開く先ではなく練習の結果として気になるもので、
 * 練習の説明ページと結果ページの TOP3 から辿れる（ドロワーにも残す）。
 */
export const TAB_BAR_NAV_ITEMS: readonly NavItemDef[] = [
  // ログイン済みは proxy がダッシュボードへ rewrite するので「次にやること」へ戻れる
  { href: "/", labelKey: "home", icon: <HomeIcon /> },
  { href: "/dojo", labelKey: "dojo", icon: <BeltIcon /> },
  { href: "/practice", labelKey: "practice", icon: <DumbbellIcon /> },
  { href: "/lessons", labelKey: "learn", icon: <BookIcon /> },
  // 対局中に片手で開くタブバーからは、早見表ハブを経由せず最も使う点数表へ直接飛ばす
  {
    href: "/reference/score-table",
    labelKey: "scoreTable",
    icon: <TableIcon />,
  },
];

/**
 * ハンバーガードロワー用のナビゲーション項目。
 * 点数表へはタブバーから直接行けるため、ドロワー側は役一覧も含む早見表ハブへ送る。
 * ログイン不要の設定への導線もここに含める。
 */
export const DRAWER_NAV_ITEMS: readonly NavItemDef[] = [
  { href: "/practice", labelKey: "practice", icon: <DumbbellIcon /> },
  { href: "/lessons", labelKey: "learn", icon: <BookIcon /> },
  { href: "/dojo", labelKey: "dojo", icon: <BeltIcon /> },
  { href: "/reference", labelKey: "reference", icon: <TableIcon /> },
  { href: "/leaderboard", labelKey: "leaderboard", icon: <ChartIcon /> },
  { href: "/preferences", labelKey: "settings", icon: <SettingsIcon /> },
];

/**
 * 今のパスがナビゲーション項目の配下にあるか。
 * 級の詳細（`/dojo/ranks/<級>`）やレッスン（`/lessons/<slug>`）でも親の項目を
 * 選択中に見せる。`/` は全パスの接頭辞になるため完全一致だけを見る。
 */
export function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}
