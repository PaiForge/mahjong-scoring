"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import {
  SettingsCard,
  SettingToggleRow,
} from "@/app/(user)/_components/setting-toggle-row";
import { useAuth } from "@/app/_contexts/auth-context";
import {
  getLeaderboardVisibility,
  setLeaderboardVisibility,
} from "../_actions/leaderboard-visibility";
import { PREFERENCE_ANCHORS } from "../_lib/anchors";

/**
 * プライバシー設定セクション
 *
 * 現状はランキングへの表示可否のみ。端末ローカルに持てるルール設定と違い
 * サーバ側（`profiles.hidden_from_leaderboard`）に保存するため、初期値は
 * ページ描画後に Server Action で取りに行く。ページ自体を動的にしないための
 * 割り切りで、取得までは同じ大きさのスケルトンを出して行の高さを保つ。
 */
export function PrivacySettingsSection() {
  const t = useTranslations("settings");
  const { user, isLoading: isAuthLoading } = useAuth();
  const [hidden, setHidden] = useState<boolean | undefined>(undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;

    if (!isAuthLoading && user) {
      void getLeaderboardVisibility().then((value) => {
        if (!cancelled) setHidden(value);
      });
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
