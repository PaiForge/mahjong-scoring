import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";

import {
  SettingLinkRow,
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useDoraDisplayMode,
  useFuHanOrder,
  useTermLinksEnabled,
} from "../hooks/use-display-settings-store";

/** 役の並び順の画面（設定の子画面） */
export const YAKU_ORDER_PATH = "/preferences/yaku-order";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される「見え方」の設定を切り替える。出題内容も
 * 正解判定も変わらない（ドラの判定は常に表示牌から導く）
 * （web の `DisplaySettingsSection`）。
 */
export function DisplaySettingsSection() {
  const t = useTranslations("settings");
  const router = useRouter();
  const doraDisplay = useDoraDisplayMode();
  const setDoraDisplay = useDisplaySettingsStore((s) => s.setDoraDisplay);
  const termLinks = useTermLinksEnabled();
  const setTermLinks = useDisplaySettingsStore((s) => s.setTermLinks);
  const fuHanOrder = useFuHanOrder();
  const setFuHanOrder = useDisplaySettingsStore((s) => s.setFuHanOrder);

  return (
    <SettingsCard>
      <SettingToggleRow
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />
      <SettingToggleRow
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={termLinks}
        onChange={setTermLinks}
      />
      {/* 符→翻が既定なので、スイッチは「翻を先にする」の向きで出す */}
      <SettingToggleRow
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "han-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "han-first" : "fu-first")
        }
      />
      {/* 36役を並び替える UI は設定画面に置くと長すぎるため専用画面へ渡す */}
      <SettingLinkRow
        onPress={() => router.push(YAKU_ORDER_PATH)}
        title={t("yakuOrderTitle")}
        description={t("yakuOrderDescription")}
      />
    </SettingsCard>
  );
}
