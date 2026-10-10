import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  highestRank,
  rankTier,
  type RankSlug,
} from "@mahjong-scoring/features/ranks/registry";

import { BeltBadge } from "../../dojo/belt-badge";
import { beltStyle } from "../../dojo/belt-style";
import { colors, radius } from "../../lib/theme";

/**
 * 昇級試験の結果の昇級バナー（web の `PromotionBanner`）
 * 昇級バナー
 *
 * 付与された段級位はサーバーの確定の応答から来るので、web のように本人の
 * 段級位と突き合わせ直さない。枠も面も帯色で、ブランドの緑で祝わない
 * （緑が授与された級の色に見えるため）。複数同時に付いたときは最上位の色と
 * 言い方で見出しを出し、行ごとの文はそれぞれの種別で出す。
 */
export function PromotionBanner({
  slugs,
}: {
  readonly slugs: readonly RankSlug[];
}) {
  const t = useTranslations("ranks");
  const awarded = highestRank(slugs)?.slug;
  if (awarded === undefined) return undefined;
  const belt = beltStyle(awarded);
  return (
    <View
      accessibilityLiveRegion="polite"
      testID="promotion-banner"
      style={[
        styles.frame,
        { borderColor: belt.border, backgroundColor: belt.tint },
      ]}
    >
      <BeltBadge slug={awarded} />
      <Text style={[styles.title, { color: belt.tintText }]}>
        {t(`promotion.title.${rankTier(awarded)}`)}
      </Text>
      <View style={styles.messages}>
        {slugs.map((slug) => (
          <Text key={slug} style={styles.message}>
            {t(`promotion.message.${rankTier(slug)}`, {
              rank: t(`names.${slug}`),
            })}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.panel,
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  messages: {
    alignItems: "center",
    gap: 2,
  },
  message: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.surface700,
  },
});
