import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { DojoHelp } from "../../dojo/dojo-help";
import { SectionTitle } from "../../components/section-title";
import { RankJourneyCard } from "../../dojo/rank-journey-card";
import { RankProgressBar } from "../../dojo/rank-progress-bar";
import { useMobileJourney } from "../../dojo/use-mobile-journey";
import { colors } from "../../lib/theme";

/**
 * 道場
 *
 * @description
 * web の道場と同じ並び: 現在の段級位（5級〜初段の区切りのバー）→ 次の目標の級（開いたカード）→
 * 「点数計算・黒帯への道」（全段級位を閉じたカードで並べる全体の地図）。
 * 行程の計算は web と同じ features の `buildJourney` で、ホームと道場で
 * 「次」の指す先を食い違わせない。
 *
 * モバイルは段級位を持たない（取得にはアカウントが要る）ので、現在の
 * 段級位は常に無級で、次の目標は 5級。学ぶ段の進み具合は端末に記録した
 * レッスンの完了から出す。見出しの「?」から道場の見方を開ける（web の
 * ツアーの代わりに 1 枚ずつ送るシート）。未ログインに添えるログインの案内は
 * 持たない。
 *
 * @flow
 * 1. 次の目標の級から、レッスン / 練習 / 試験（模試）へ進む
 * 2. 級名を押すと級の詳細へ
 */
export default function DojoPage() {
  const t = useTranslations("dojo");
  const journey = useMobileJourney();

  return (
    <Screen
      title={t("title")}
      inTabs
      titleAction={<DojoHelp />}
      contentStyle={styles.content}
    >
      {/* 現在の段級位は節にせずバーで示す。モバイルは常に無級 */}
      <RankProgressBar currentSlug={undefined} />

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
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
  },
});
