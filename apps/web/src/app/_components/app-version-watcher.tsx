"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  APP_BUILD_ID,
  APP_VERSION_ENDPOINT,
  isAppVersionResponse,
} from "@/app/_lib/app-version";
import {
  canReloadNow,
  resolveFullNavigationHref,
} from "./_lib/app-version-policy";

/**
 * 表示中のタブが配信中のビルドを確かめる間隔
 *
 * デプロイは日に数回も無く、応答はビルド定数の JSON 1 つ。短くしても得る
 * ものは少なく、長すぎると「タブを開いたまま作業を続ける人」に古い版が
 * 残る時間がそのまま延びる。タブへの復帰時にも確かめるので、間隔は
 * 「開いたまま触り続けている人」のためだけの保険。
 */
export const APP_VERSION_CHECK_INTERVAL_MS = 5 * 60 * 1000;

/**
 * ページの再読み込みと移動。本番は `window.location`、テストは差し替える
 * （jsdom の `location` は差し替えられないため）
 */
export interface PageNavigation {
  readonly reload: () => void;
  readonly assign: (href: string) => void;
}

const BROWSER_NAVIGATION: PageNavigation = {
  reload: () => window.location.reload(),
  assign: (href) => window.location.assign(href),
};

async function fetchDeployedBuildId(): Promise<string | undefined> {
  try {
    const response = await fetch(APP_VERSION_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return undefined;
    const body: unknown = await response.json();
    return isAppVersionResponse(body) ? body.buildId : undefined;
  } catch {
    // 回線断・一時的な 5xx。次の機会に確かめ直せばよく、ここで騒がない
    return undefined;
  }
}

interface AppVersionWatcherProps {
  /** テスト用。省略時は `window.location` */
  readonly navigation?: PageNavigation;
}

/**
 * デプロイ後も開いたままのタブを、利用者の操作を待たずに新版へ乗り換えさせる
 * 版の監視
 *
 * @description
 * 自分のバンドルのビルド ID（`APP_BUILD_ID`）と `/api/version` が返す配信中の
 * ID を、タブへの復帰時と {@link APP_VERSION_CHECK_INTERVAL_MS} ごとに比べる。
 * 違っていれば古い版なので、乗り換える:
 *
 * 1. 出題セッションの最中でも文字の入力中でもなければ、その場で再読み込みする
 * 2. そうでなければ、次の画面内リンクのクリックをフルナビゲーションに
 *    差し替える（`canReloadNow` / `resolveFullNavigationHref`）。パスが
 *    変わったときにも 1 を試し直すので、`router.push` による移動も拾う
 *
 * 利用者に文言は出さない。「更新があったのでやり直してください」は、何も
 * していない利用者から見れば理不尽で、合格ラインの緩和のように早く届けたい
 * 変更ほど黙って届くべきだから。
 *
 * @design 対象にしているのは Next が自分で拾わない 2 つの穴
 *
 * Next はサーバーへ問い合わせる遷移（動的ルート・先読みの切れた静的ルート）で
 * ビルド ID の不一致を検知するとフルリロードに切り替える。残るのは、先読みが
 * 手元にあって問い合わせの起きない遷移と、遷移せずに留まるタブで、どちらも
 * 古い版のまま画面が出る。合格ラインの変更がデプロイ後も「10 問」と見えた
 * のはこれ（2026-10）。
 *
 * ローカルビルドでは `APP_BUILD_ID` が無く、何もしない。
 */
export function AppVersionWatcher({
  navigation = BROWSER_NAVIGATION,
}: AppVersionWatcherProps) {
  const pathname = usePathname();
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    if (APP_BUILD_ID === undefined || isStale) return;
    let cancelled = false;

    const check = async () => {
      if (document.visibilityState !== "visible") return;
      const deployed = await fetchDeployedBuildId();
      if (cancelled || deployed === undefined || deployed === APP_BUILD_ID) {
        return;
      }
      setIsStale(true);
    };
    const onVisibilityChange = () => void check();

    document.addEventListener("visibilitychange", onVisibilityChange);
    const timer = window.setInterval(
      () => void check(),
      APP_VERSION_CHECK_INTERVAL_MS,
    );
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.clearInterval(timer);
    };
  }, [isStale]);

  useEffect(() => {
    if (!isStale) return;

    const reloadIfSafe = (): boolean => {
      if (!canReloadNow(pathname, document.activeElement)) return false;
      navigation.reload();
      return true;
    };
    if (reloadIfSafe()) return;

    const onClickCapture = (event: MouseEvent) => {
      const href = resolveFullNavigationHref(event, window.location);
      if (href === undefined) return;
      // Next の <Link> に渡る前に止める。渡すと router.push とフル
      // ナビゲーションが同時に走り、履歴に同じ URL の古い版が 1 つ残る
      event.preventDefault();
      event.stopPropagation();
      navigation.assign(href);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") reloadIfSafe();
    };

    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isStale, pathname, navigation]);

  return null;
}
