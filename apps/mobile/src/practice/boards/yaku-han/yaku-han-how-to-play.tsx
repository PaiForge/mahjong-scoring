import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { yakuLabel } from "@mahjong-scoring/features/yaku/yaku-labels";

import { QuestionPrompt } from "../../components/question-prompt";
import { YakuHanPrompt } from "./yaku-han-prompt";

/**
 * デモ用の固定例: 三色同順（鳴き）
 *
 * 値は表示名ではなく出題と同じ core の役名（識別子）。表示名は辞書
 * （`yakuNames.sanshoku_doujun`）から引くので、英語の端末には英語で出る。
 * `yakuNames` の日本語は core の役名と一致するので、日本語の表示は変わらない。
 */
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
  const tYakuNames = useTranslations("yakuNames");

  return (
    <View style={styles.root}>
      <YakuHanPrompt
        // 例: yakuNames.sanshoku_doujun（完成形のキーで grep したときにここへ着地させるための例）
        yakuName={yakuLabel(DEMO_YAKU, tYakuNames)}
        isMenzen={DEMO_IS_MENZEN}
      />
      <QuestionPrompt>{t("selectHan")}</QuestionPrompt>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
});
