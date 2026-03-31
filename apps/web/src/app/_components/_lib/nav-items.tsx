import { HomeIcon } from "../icons/home-icon";
import { BookIcon } from "../icons/book-icon";
import { TableIcon } from "../icons/table-icon";
import { ChartIcon } from "../icons/chart-icon";

/**
 * ナビゲーション項目の定義
 * ナビゲーション項目
 */
export interface NavItemDef {
  readonly href: string;
  readonly labelKey: string;
  readonly icon: React.ReactNode;
}

/** サイドバー・モバイルタブバー共通のナビゲーション項目 */
export const NAV_ITEMS: readonly NavItemDef[] = [
  { href: "/", labelKey: "home", icon: <HomeIcon /> },
  { href: "/practice", labelKey: "practice", icon: <BookIcon /> },
  { href: "/reference", labelKey: "reference", icon: <TableIcon /> },
  { href: "/leaderboard", labelKey: "leaderboard", icon: <ChartIcon /> },
];
