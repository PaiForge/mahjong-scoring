/**
 * 役の並び順
 *
 * @description 役を選ぶときの選択肢の並びを、よく使う順に並び替える。
 * 端末ローカルに保存し、役の選択練習と点数計算練習の両方に効く。
 * 出題内容も正解判定も変えない。
 * @flow 設定 → 役の並び順
 */
import { StyleSheet } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { YakuOrderSection } from "../../preferences/yaku-order-section";

/** 鍵と保存の帯の位置（`Screen` の子の並びで数える）。36 行の上に追従させる */
const TOOLBAR_INDEX = 2;

export default function YakuOrderScreen() {
  const t = useTranslations("settings.yakuOrder");

  return (
    <YakuOrderSection
      renderLayout={({ description, toolbar, list, footer }) => (
        <Screen
          title={t("pageTitle")}
          back
          contentStyle={styles.content}
          stickyHeaderIndices={[TOOLBAR_INDEX]}
        >
          <SectionTitle>{t("sectionTitle")}</SectionTitle>
          {description}
          {toolbar}
          {list}
          {footer}
        </Screen>
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 12,
  },
});
