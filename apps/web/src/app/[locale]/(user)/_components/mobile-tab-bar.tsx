import { getLocaleLinks } from "./_lib/locale-link-table";
import { MobileTabBarView } from "./mobile-tab-bar-view";

/**
 * モバイル下部のタブバー
 *
 * 言語ごとの公開状態はサーバーで引いて表にし（`getLocaleLinks`）、
 * クライアントの本体（`MobileTabBarView`）へ渡す。本体が公開状態の
 * モジュールを直接読むと、全ページのクライアント JS にルートの
 * レジストリが載るため。
 */
export async function MobileTabBar() {
  return <MobileTabBarView localeLinks={await getLocaleLinks()} />;
}
