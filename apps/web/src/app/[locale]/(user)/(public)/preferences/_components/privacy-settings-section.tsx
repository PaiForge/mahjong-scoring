"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import {
  SettingsCard,
  SettingToggleRow,
} from "@/app/[locale]/(user)/_components/setting-toggle-row";
import { useAuth } from "@/app/_contexts/auth-context";
import {
  getLeaderboardVisibility,
  setLeaderboardVisibility,
} from "../_actions/leaderboard-visibility";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

/**
 * プライバシー設定セクション
 *
 * 現状はランキングへの表示可否のみ。端末ローカルに持てるルール設定と違い
 * サーバ側（`profiles.hidden_from_leaderboard`）に保存するため、初期値は
 * ページ描画後に Server Action で取りに行く。ページ自体を動的にしないための
 * 割り切りで、取得までは同じ大きさのスケルトンを出して行の高さを保つ。
 *
 * 初期値を読めなかったときはスケルトンのまま押させず、トーストで知らせる。
 * 既定値（オフ）を映すと、非表示にしている人に違う値を見せ、押すと意図と
 * 逆に切り替わるため。
 */
export function PrivacySettingsSection() {
  const t = useTranslations("settings");
  const { user, isLoading: isAuthLoading } = useAuth();
  const [hidden, setHidden] = useState<boolean | undefined>(undefined);
  const [, startTransition] = useTransition();
  // 取り直しの条件（ログイン状態）に `t` を混ぜない。混ぜると `t` が変わる
  // たびに取り直し、押した直後の値を古い値で上書きする
  const notifyLoadFailedToast = useEffectEvent(() => {
    toast.error(t("leaderboardVisibilityLoadFailedToast"));
  });

  useEffect(() => {
    let cancelled = false;

    if (!isAuthLoading && user) {
      const notifyLoadFailed = () => {
        if (!cancelled) notifyLoadFailedToast();
      };
      getLeaderboardVisibility().then((value) => {
        if (value === undefined) {
          notifyLoadFailed();
          return;
        }
        if (!cancelled) setHidden(value);
      }, notifyLoadFailed);
    }

    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  // 未ログインでは設定を持てない。ゲートが操作を塞ぐので、取りに行かず
  // 既定値（＝ランキングに出る）をそのまま映す。
  const isSignedIn = user !== null;
  const isReady = !isAuthLoading && (!isSignedIn || hidden !== undefined);

  const handleChange = (next: boolean) => {
    const previous = hidden;
    setHidden(next);

    startTransition(async () => {
      const result = await setLeaderboardVisibility(next);
      if ("error" in result) {
        setHidden(previous);
        toast.error(t("leaderboardVisibilityFailedToast"));
      }
    });
  };

  return (
    <SettingsCard>
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.leaderboardVisibility}
        title={t("leaderboardVisibilityTitle")}
        description={t("leaderboardVisibilityDescription")}
        checked={isSignedIn ? (hidden ?? false) : false}
        onChange={handleChange}
        loading={!isReady}
      />
    </SettingsCard>
  );
}
