"use client";

import { useTranslations } from "next-intl";

import {
  SettingsCard,
  SettingToggleRow,
} from "@/app/[locale]/(user)/_components/setting-toggle-row";
import {
  useDisplaySettingsStore,
  useDoraDisplayMode,
  useFuHanOrder,
  useTermLinksEnabled,
} from "@/app/_hooks/use-display-settings-store";
import { PREFERENCE_ANCHORS } from "@mahjong-scoring/features/settings/preference-anchors";

/**
 * 表示設定セクション
 *
 * 端末ローカルに保存される、アプリ全体の「見え方」の設定を切り替える — ドラの見せ方・
 * 用語リンクの有無・符と翻の並び順。どれも練習の盤面に限らずレッスンや点数表でも効く。
 * 出題内容も正解判定も変わらない（ドラの判定は常に表示牌から導く）。
 *
 * 問題を解く画面（練習・昇級試験）でだけ効く設定（点数と子ツモの入力方式、Pro の
 * 盤面の 2 行、役の並び順）は `PracticeSettingsSection` に置く。保存先は同じ表示設定
 * ストアだが、節は画面上の分類でストアの分け方とは一致させない。
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
      {/* 練習中の「ドラの見方」から `/preferences#dora-display` で直接飛んで来られる */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.doraDisplay}
        title={t("doraDisplayTitle")}
        description={t("doraDisplayDescription")}
        checked={doraDisplay === "actual"}
        onChange={(checked) => setDoraDisplay(checked ? "actual" : "indicator")}
      />

      {/* 保存値（termLinks）は「リンクを出す」で既定 true のまま、スイッチだけ
          反転して「リンクなしで表示する」として見せる。設定のスイッチは既定 OFF に
          揃えており、リンクは覚えた人が外すものなので、ON にする側を外す操作に置く */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.termLinks}
        title={t("termLinksTitle")}
        description={t("termLinksDescription")}
        checked={!termLinks}
        onChange={(checked) => setTermLinks(!checked)}
      />

      {/* 翻→符が既定なので、スイッチは「符を先にする」の向きで出す */}
      <SettingToggleRow
        id={PREFERENCE_ANCHORS.fuHanOrder}
        title={t("fuHanOrderTitle")}
        description={t("fuHanOrderDescription")}
        checked={fuHanOrder === "fu-first"}
        onChange={(checked) =>
          setFuHanOrder(checked ? "fu-first" : "han-first")
        }
      />
    </SettingsCard>
  );
}
