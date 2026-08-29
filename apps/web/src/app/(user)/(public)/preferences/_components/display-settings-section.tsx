"use client";

import { useTranslations } from "next-intl";

import {
  SettingLinkRow,
  SettingsCard,
  SettingToggleRow,
} from "@/app/(user)/_components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useDoraDisplayMode,
  useTermLinksEnabled,
} from "@/app/_hooks/use-display-settings-store";
import { PREFERENCE_ANCHORS, YAKU_ORDER_HREF } from "../_lib/anchors";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される「見え方」の設定を切り替える。出題内容も
 * 正解判定も変わらない（ドラの判定は常に表示牌から導く）。
 */
export function DisplaySettingsSection() {
  const t = useTranslations("settings");
  const doraDisplay = useDoraDisplayMode();
  const setDoraDisplay = useDisplaySettingsStore((s) => s.setDoraDisplay);
  const termLinks = useTermLinksEnabled();
  const setTermLinks = useDisplaySettingsStore((s) => s.setTermLinks);

  return (
    <SettingsCard>
      {/* 練習中の「ドラの見方」から `/preferences#dora-display` で直接飛んで来られる */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.doraDisplay}
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />

      <SettingToggleRow
        id={PREFERENCE_ANCHORS.termLinks}
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={termLinks}
        onChange={setTermLinks}
      />

      {/* 36役を並び替える UI は設定ページに置くと長すぎるため専用ページへ渡す */}
      <SettingLinkRow
        href={YAKU_ORDER_HREF}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}
