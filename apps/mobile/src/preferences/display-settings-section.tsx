import { useTranslations } from "use-intl";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

import {
  SettingsCard,
  SettingToggleRow,
} from "../components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useDoraDisplayMode,
  useFuHanOrder,
  useTermLinksEnabled,
} from "../hooks/use-display-settings-store";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される、アプリ全体の「見え方」の設定を切り替える
 * （web の `DisplaySettingsSection`）。盤面・レッスン・点数表のどこでも効く
 * 見え方（ドラ・用語リンク・符と翻の順）だけを置き、問題を解く画面（練習・
 * 昇級試験）でだけ効く行（点数の入力方式・盤面の見せ方等）は「練習」の節に置く。
 * 出題内容も正解判定も変わらない（ドラの判定は常に表示牌から導く）。
 */
export function DisplaySettingsSection() {
  const t = useTranslations("settings");
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
        anchor={PREFERENCE_ANCHORS.doraDisplay}
      />
      {/* 保存値（termLinks）は「リンクを出す」で既定 true のまま、スイッチだけ
          反転して「リンクなしで表示する」として見せる。設定のスイッチは既定 OFF に
          揃えており、リンクは覚えた人が外すものなので、ON にする側を外す操作に置く */}
      <SettingToggleRow
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={!termLinks}
        onChange={(checked) => setTermLinks(!checked)}
        anchor={PREFERENCE_ANCHORS.termLinks}
      />
      {/* 翻→符が既定なので、スイッチは「符を先にする」の向きで出す */}
      <SettingToggleRow
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "fu-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "fu-first" : "han-first")
        }
        anchor={PREFERENCE_ANCHORS.fuHanOrder}
      />
    </SettingsCard>
  );
}
