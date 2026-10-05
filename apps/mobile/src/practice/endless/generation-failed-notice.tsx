import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { Button } from "../../components/button";
import { Screen } from "../../components/screen";
import { colors } from "../../lib/theme";

/**
 * 出題条件に合う手牌を作れなかったときの案内（web の `GenerationFailedNotice`）
 * 出題生成失敗
 *
 * リトライを使い切っても出題条件に合う手牌を作れなかったときに盤面の代わりに
 * 出す。読み込み中のまま固まらないよう、条件を変えて戻る導線を明示する。
 */
export function GenerationFailedNotice({
  translationNamespace,
  onBackToSetup,
}: {
  /** 見出し・案内文・ボタンの文言を引く辞書の namespace */
  readonly translationNamespace: "score" | "machiScore";
  readonly onBackToSetup: () => void;
}) {
  const t = useTranslations(translationNamespace);
  return (
    <Screen title={t("title")} back backIcon="close" onBack={onBackToSetup}>
      <View style={styles.body}>
        <Text style={styles.text}>{t("board.generationFailed")}</Text>
        <Button variant="secondary" onPress={onBackToSetup}>
          {t("board.backToSetup")}
        </Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    alignItems: "center",
    gap: 24,
    paddingVertical: 32,
  },
  text: {
    textAlign: "center",
    fontSize: 14,
    lineHeight: 24,
    color: colors.surface700,
  },
});
