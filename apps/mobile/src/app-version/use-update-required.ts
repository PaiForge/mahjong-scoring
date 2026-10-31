import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { mobileAppVersionApiUrl } from "@mahjong-scoring/features/app-version/mobile-api";

import { readJson } from "../auth/read-json";
import { SITE_URL } from "../lib/app-site-url";
import { APP_PLATFORM, APP_VERSION } from "./app-version";
import { isUpdateRequired } from "./update-requirement";

/**
 * この版のアプリを使い続けられないか（ルートで 1 回だけ呼ぶ）
 * アップデート要否フック
 *
 * 起動時と、アプリが前面に戻ったときに最低バージョンの API を読む。
 * 通信できない・読めないときは前の答えのまま（初めは「使える」）にする —
 * オフラインで起動した人を締め出さない。
 */
export function useUpdateRequired(): boolean {
  const [required, setRequired] = useState(false);

  useEffect(() => {
    if (APP_PLATFORM === undefined) return;
    const url = `${SITE_URL}${mobileAppVersionApiUrl(APP_PLATFORM)}`;
    let active = true;
    const check = async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) return;
        const body = await readJson(response);
        if (active) setRequired(isUpdateRequired(body, APP_VERSION));
      } catch {
        // 通信できなければ前の答えのまま
      }
    };
    void check();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    return () => {
      active = false;
      sub.remove();
    };
  }, []);

  return required;
}
