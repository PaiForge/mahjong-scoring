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
 */
export const TAB_BAR_NAV_ITEMS: readonly NavItemDef[] = [
  { href: "/practice", labelKey: "practice", icon: <DumbbellIcon /> },
  { href: "/learn", labelKey: "learn", icon: <BookIcon /> },
  // 早見表ハブではなく、対局中に最も使う点数表へ直接リンクする
  {
    href: "/reference/score-table",
    labelKey: "scoreTable",
    icon: <TableIcon />,
  },
  { href: "/leaderboard", labelKey: "leaderboard", icon: <ChartIcon /> },
];

/**
 * ハンバーガードロワー用のナビゲーション項目。
 * タブバーの項目に加えて、ログイン不要の設定への導線を含める。
 */
export const DRAWER_NAV_ITEMS: readonly NavItemDef[] = [
  ...TAB_BAR_NAV_ITEMS,
  { href: "/preferences", labelKey: "settings", icon: <SettingsIcon /> },
];
