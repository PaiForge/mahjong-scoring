import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { QuestionPrompt } from "../../components/question-prompt";
import { YakuHanPrompt } from "./yaku-han-prompt";

/** デモ用の固定例: 三色同順（鳴き） */
const DEMO_YAKU = "三色同順";
const DEMO_IS_MENZEN = false;

/**
 * 役翻数練習の「問題方式」デモ（web の `YakuHanHowToPlay`）
 * 役翻数 遊び方デモ
 *
 * 実際の出題（役名・門前/鳴きの状態提示と出題文）を静的に再現する。翻数の
 * 選択肢は今後変更の可能性があるため含めない（何を答えるかは出題文が示す）。
 * 出題の枠は説明画面の「問題方式」の枠が兼ねるので、盤面の枠は持たない。
 */
export function YakuHanHowToPlay() {
  const t = useTranslations("yakuHanChallenge");

  return (
    <View style={styles.root}>
      <YakuHanPrompt yakuName={DEMO_YAKU} isMenzen={DEMO_IS_MENZEN} />
      <QuestionPrompt>{t("selectHan")}</QuestionPrompt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
