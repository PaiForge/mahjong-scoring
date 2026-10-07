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
} from "../hooks/use-display-settings-store";
import { YAKU_ORDER_PATH } from "@mahjong-scoring/features/routes";

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
      {/* 用語リンク（web の「用語リンクなしで表示する」）は出さない。モバイルには
          用語集が無く、本文の用語は押せない太字で描くだけなので、切り替えても
          何も変わらない。用語集を移植したらここに戻す */}
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
