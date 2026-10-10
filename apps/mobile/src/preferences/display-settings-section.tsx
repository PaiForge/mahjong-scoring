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
  useKoTsumoInput,
  useTermLinksEnabled,
} from "../hooks/use-display-settings-store";
import { YAKU_ORDER_PATH } from "@mahjong-scoring/features/routes";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される「見え方」の設定を切り替える。出題内容も
 * 正解判定も変わらない（ドラの判定は常に表示牌から導く）。子ツモの入力方式も
 * 受け付ける回答は変えず、答え方の形だけを変える
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
  const koTsumoInput = useKoTsumoInput();
  const setKoTsumoInput = useDisplaySettingsStore((s) => s.setKoTsumoInput);

  return (
    <SettingsCard>
      <SettingToggleRow
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />
      {/* 保存値（termLinks）は「リンクを出す」で既定 true のまま、スイッチだけ
          反転して「リンクなしで表示する」として見せる。設定のスイッチは既定 OFF に
          揃えており、リンクは覚えた人が外すものなので、ON にする側を外す操作に置く */}
      <SettingToggleRow
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={!termLinks}
        onChange={(checked) => setTermLinks(!checked)}
      />
      {/* 翻→符が既定なので、スイッチは「符を先にする」の向きで出す */}
      <SettingToggleRow
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "fu-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "fu-first" : "han-first")
        }
      />
      {/* 組の 1 つの select が既定なので、スイッチは「分けて選ぶ」の向きで出す */}
      <SettingToggleRow
        title={t("koTsumoInputTitle")}
        description={t("koTsumoInputDescription")}
        checked={koTsumoInput === "split"}
        onChange={(checked) => setKoTsumoInput(checked ? "split" : "combined")}
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
