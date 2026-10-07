import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { AGARI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../../ads/native-ad-row";
import { useNativeAds } from "../../../ads/use-native-ads";
import { LinkRowList } from "../../../components/link-row";
import { Screen } from "../../../components/screen";
import { AgariScoreHelpTour } from "../../../practice/endless/agari-score/agari-score-help";
import { SectionTitle } from "../../../components/section-title";
import { useAgariScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { RelatedLessonsSection } from "../../../practice/endless/related-lessons-section";
import { ScoreSetupForm } from "../../../practice/endless/agari-score/score-setup-form";
import { useAgariScoreStore } from "../../../practice/endless/agari-score/use-agari-score-store";

/**
 * 和了形の点数計算 設定
 *
 * @description
 * 和了形の点数計算の設定画面。時計もミス上限も無く好きなだけ解ける練習で、
 * 始める前に役の回答・満貫の簡略化・符の入力・自動で次へ・親子・点数帯・
 * 出題する役を選ぶ。下に点数の計算セクションのレッスンと広告の行を並べる。
 *
 * @flow
 * 1. 練習一覧のバナーから遷移
 * 2. 設定を選ぶ（端末に保存され、次回も同じ設定で始まる）
 * 3. 「開始する」で play 画面へ
 */
export default function ScoreSetupPage() {
  const t = useTranslations("agariScore");
  const tp = useTranslations("practice");
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceIntro);

  return (
    <Screen
      title={t("title")}
      back
      titleAction={<AgariScoreHelpTour />}
      contentStyle={styles.content}
    >
      <View style={styles.section}>
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <ScoreSetupForm
          settingsStore={useAgariScoreSettingsStore}
          playPath={`${AGARI_SCORE_PRACTICE_HREF}/play`}
          onStart={() => useAgariScoreStore.getState().setQuestion(undefined)}
        />
      </View>

      {/* 点数の計算セクションの章はどれも本文の導線でこの練習へ送る。戻る先を
          その章にそろえる（web と同じ） */}
      <RelatedLessonsSection section="score" />

      {ad !== undefined && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  section: {
    gap: 16,
  },
});
