import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { BeltBadge } from "../../dojo/belt-badge";
import { beltStyle } from "../../dojo/belt-style";
import { RankJourneyCard } from "../../dojo/rank-journey-card";
import { useMobileJourney } from "../../dojo/use-mobile-journey";
import { colors, radius } from "../../lib/theme";

/**
 * 道場
 *
 * @description
 * web の道場と同じ並び: 現在の段級位（1 行）→ 次の目標の級（開いたカード）→
 * 「点数計算・黒帯への道」（全段級位を閉じたカードで並べる全体の地図）。
 * 行程の計算は web と同じ features の `buildJourney` で、ホームと道場で
 * 「次」の指す先を食い違わせない。
 *
 * モバイルは段級位を持たない（取得にはアカウントが要る）ので、現在の
 * 段級位は常に無級で、次の目標は 5級。学ぶ段の進み具合は端末に記録した
 * レッスンの完了から出す。web の見出しの「?」のツアーと、未ログインに
 * 添えるログインの案内は持たない。
 *
 * @flow
 * 1. 次の目標の級から、レッスン / 練習 / 試験（模試）へ進む
 * 2. 級名を押すと級の詳細へ
 */
export default function DojoPage() {
  const t = useTranslations("dojo");
  const journey = useMobileJourney();

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      {/* 現在の段級位は節にせず 1 行で示す。無級なので帯色も枠も淡いグレー */}
      <View
        style={[
          styles.currentRank,
          { borderColor: beltStyle(undefined).border },
        ]}
      >
        <BeltBadge slug={undefined} />
        <View style={styles.currentRankBody}>
          <Text accessibilityRole="header" style={styles.currentRankLabel}>
            {t("currentRankTitle")}
          </Text>
          <Text style={styles.currentRankName}>{t("unranked")}</Text>
        </View>
      </View>

      {journey.current !== undefined && (
        <View style={styles.section}>
          <SectionTitle>{t("nextRankTitle")}</SectionTitle>
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
  currentRank: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 3,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  currentRankBody: {
    flex: 1,
    minWidth: 0,
  },
  currentRankLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface500,
  },
  currentRankName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
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
