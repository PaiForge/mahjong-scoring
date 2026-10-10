import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { highestRank } from "@mahjong-scoring/features/ranks/registry";
import { PRACTICE_PATH } from "@mahjong-scoring/features/routes";

import { Screen } from "../../components/screen";
import { DojoHelp } from "../../dojo/dojo-help";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { RankJourneyCard } from "../../dojo/rank-journey-card";
import { RankProgressBar } from "../../dojo/rank-progress-bar";
import { useMobileJourney } from "../../dojo/use-mobile-journey";
import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";
import { usePracticeModeStore } from "../../hooks/use-practice-mode-store";
import { useAccountProgress } from "../../records/use-account-progress";
import { useGoToTab } from "../../hooks/use-go-to-tab";

/**
 * 道場
 *
 * @description
 * web の道場と同じ並び: 現在の段級位（5級〜初段の区切りのバー）→ 次の目標の級（開いたカード）→
 * 「点数計算・黒帯への道」（全段級位を閉じたカードで並べる全体の地図）。
 * 行程の計算は web と同じ features の `buildJourney` で、ホームと道場で
 * 「次」の指す先を食い違わせない。
 *
 * ログイン中は段級位・レッスンの完了・チャレンジの記録をサーバーから読む。
 * ゲストは段級位を持たない（無級で、次の目標は 5級）で、進み具合は端末の記録
 * から出す。ログイン中に端末のゲストの「チャレンジを終えた練習」も行程に
 * 数えたときは、道の見出しの下に「この端末の履歴を含みます」と添える
 * （サーバーの記録だけでは済みにならない練習があると分かるように）。見出しの
 * 「?」から道場の見方を開ける（web のツアーの代わりに 1 枚ずつ送るシート）。
 * 未ログインに添えるログインの案内は持たない。
 *
 * 初段（黒帯）を取った人には、バーの下に実戦練習への案内を出す（web と同じ）。
 * 練習一覧の表示はストアが持つので、実戦に切り替えてから練習のタブへ移る。
 *
 * @flow
 * 1. 次の目標の級から、レッスン / 練習 / 試験（模試）へ進む
 * 2. 級名を押すと級の詳細へ
 */
export default function DojoPage() {
  const t = useTranslations("dojo");
  const journey = useMobileJourney();
  const { input, includesDeviceAttempts } = useAccountProgress();
  const current = highestRank(input.achievedRankSlugs);
  const goToTab = useGoToTab();
  const setPracticeMode = usePracticeModeStore((state) => state.setMode);

  return (
    <Screen
      title={t("title")}
      inTabs
      titleAction={<DojoHelp />}
      contentStyle={styles.content}
    >
      {/* 現在の段級位は節にせずバーで示す。ゲストは常に無級 */}
      <RankProgressBar currentSlug={current?.slug} />

      {current?.slug === "dan-1" && (
        <View style={[panelFrame, styles.practical]}>
          <SectionTitle>{t("practicalTitle")}</SectionTitle>
          <Text style={styles.body}>{t("practicalDescription")}</Text>
          <TextLink
            onPress={() => {
              setPracticeMode("practical");
              goToTab(PRACTICE_PATH);
            }}
          >
            {t("practicalCta")}
          </TextLink>
        </View>
      )}

      {journey.current !== undefined && (
        // 見出しは置かない（web と同じ）。カードの中に「次の目標」の状態の印が
        // あり、すぐ上の区切りバーでも次の級を示しているため、見出しを重ねると
        // 同じことを 3 度言う。節の名前は読み上げ用に残す
        <View accessible={false} accessibilityLabel={t("nextRankTitle")}>
          <RankJourneyCard journey={journey.current} expanded />
        </View>
      )}

      <View style={styles.section}>
        <SectionTitle>{t("journeyTitle")}</SectionTitle>
        {includesDeviceAttempts && (
          <Text style={styles.note}>{t("includesDeviceHistory")}</Text>
        )}
        {journey.ranks.map((rankJourney) => (
          <RankJourneyCard
            key={rankJourney.rank.slug}
            journey={rankJourney}
            expanded={false}
          />
        ))}
      </View>

      {journey.current === undefined && (
        <View style={styles.section}>
          <SectionTitle>{t("comingSoonTitle")}</SectionTitle>
          <Text style={styles.body}>{t("comingSoon")}</Text>
        </View>
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
  practical: {
    gap: 12,
    padding: 20,
    backgroundColor: colors.brandSubtle,
  },
  note: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface500,
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
  },
});
