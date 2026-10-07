import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { MACHI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { NativeAdRow } from "../../../ads/native-ad-row";
import { useNativeAds } from "../../../ads/use-native-ads";
import { LinkRowList } from "../../../components/link-row";
import { Screen } from "../../../components/screen";
import { MachiScoreHelpTour } from "../../../practice/endless/machi-score/machi-score-help";
import { SectionTitle } from "../../../components/section-title";
import { useMachiScoreSettingsStore } from "../../../hooks/use-score-settings-store";
import { colors } from "../../../lib/theme";
import { useMachiScoreStore } from "../../../practice/endless/machi-score/use-machi-score-store";
import { ScoreSetupForm } from "../../../practice/endless/score/score-setup-form";

/**
 * 聴牌形の点数計算 設定
 *
 * @description
 * 聴牌形の点数計算の設定画面。聴牌形から待ち牌を読み、待ちごとにツモ・ロンの
 * 点数を答える練習で、設定項目は和了形の点数計算と同じ（保存先だけ分ける）。役の
 * 絞り込みは持たない — 待ちごとに役が変わる出題で「どの待ちに掛けるか」を
 * 定められないため。出題範囲の但し書きは開始ボタンの下に脚注として出す。
 *
 * @flow
 * 1. 練習一覧のバナーから遷移
 * 2. 設定を選ぶ（端末に保存される）
 * 3. 「開始する」で play 画面へ
 */
export default function MachiScoreSetupPage() {
  const t = useTranslations("machiScore");
  const tp = useTranslations("practice");
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.practiceIntro);

  return (
    <Screen
      title={t("title")}
      back
      titleAction={<MachiScoreHelpTour />}
      contentStyle={styles.content}
    >
      <View style={styles.section}>
        <SectionTitle>{tp("settingsTitle")}</SectionTitle>
        <ScoreSetupForm
          settingsStore={useMachiScoreSettingsStore}
          playPath={`${MACHI_SCORE_PRACTICE_HREF}/play`}
          onStart={() => useMachiScoreStore.getState().setQuestion(undefined)}
          showYakuFilter={false}
        >
          {/* 始める前に読ませる告知ではなく、「なぜこの形しか出ないのか」を
              引くための脚注（web と同じ） */}
          <View style={styles.notes}>
            <Text style={styles.note}>{t("notes.mentsuOnly")}</Text>
            <Text style={styles.note}>{t("notes.multiWait")}</Text>
          </View>
        </ScoreSetupForm>
      </View>

      {/* 関連するレッスンの節を持たないので、設定の後ろに直接置く（web と同じ） */}
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
  notes: {
    gap: 2,
  },
  note: {
    fontSize: 12,
    lineHeight: 20,
    color: colors.surface500,
  },
});
