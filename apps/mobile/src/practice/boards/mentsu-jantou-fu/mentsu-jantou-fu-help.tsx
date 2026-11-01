import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MENTSU_JANTOU_FU_HELP_SECTIONS } from "@mahjong-scoring/features/practice/mentsu-jantou-fu/help-sections";

import { HelpIconButton } from "../../../components/help-icon-button";
import { InfoModal } from "../../../components/info-modal";
import { colors } from "../../../lib/theme";

/**
 * 面子と雀頭の符計算のヘルプ
 * 面子・雀頭符ヘルプ
 *
 * web の `MentsuJantouFuHelp`（`PracticeHelpButton`）の移植。練習名の右隣の
 * 「?」から、盤面を見ても読み取れない「何を符に数え、何を数えないか」を
 * モーダルで読ませる。とくに次の 3 つは、正しく数えたつもりで外しやすい:
 *
 * - 刻子の符は和了方法で変わる（ロンで完成した刻子は明刻）
 * - 雀頭・順子の符は待ちの形と関係ない（単騎・嵌張・辺張の 2 符は待ちに付く符）
 * - 副底・ツモ符・待ちの符はこの練習の対象外
 *
 * 制限時間のあるチャレンジでは使わない（開いている間も時計は止まらない）。
 */
export function MentsuJantouFuHelp() {
  const t = useTranslations("mentsuJantouFu.help");
  const tCommon = useTranslations("common");
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <HelpIconButton onPress={() => setIsOpen(true)} label={t("label")} />
      <InfoModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title={t("title")}
        closeLabel={tCommon("close")}
      >
        <View style={styles.sections}>
          {MENTSU_JANTOU_FU_HELP_SECTIONS.map((section) => (
            <View key={section} style={styles.section}>
              <Text style={styles.heading}>{t(`${section}.title`)}</Text>
              <Text style={styles.body}>{t(`${section}.body`)}</Text>
            </View>
          ))}
        </View>
      </InfoModal>
    </>
  );
}

const styles = StyleSheet.create({
  sections: {
    gap: 16,
  },
  section: {
    gap: 4,
  },
  heading: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface900,
  },
  body: {
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface700,
  },
});
