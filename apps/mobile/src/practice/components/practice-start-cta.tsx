import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  practicePlayHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";

import { Button, buttonForeground } from "../../components/button";
import { DashedDivider } from "../../components/dashed-divider";
import { InfinityIcon, PlayIcon } from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * チャレンジ / トレーニングの開始導線（web の `PracticeStartCta`）
 *
 * チャレンジを主（緑の塗り）、トレーニングを従（白地）にして「または」で区切る。
 */
export function PracticeStartCta({
  slug,
  variant,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
}) {
  const router = useRouter();
  const tc = useTranslations("challenge");
  const tp = useTranslations("practice");
  const tt = useTranslations("training");
  const { timeLimit, mistakeLimit } = practiceMenuBySlug(slug);
  const rules = { timeLimit, mistakeLimit };

  return (
    <View style={styles.frame}>
      <View style={styles.block}>
        <Button
          size="lg"
          fullWidth
          icon={<PlayIcon size={16} color={buttonForeground("primary")} />}
          onPress={() => router.push(practicePlayHref(slug, variant))}
          testID="start-challenge"
        >
          {tc("startButton")}
        </Button>
        <Text style={styles.hint}>{tp("modeChallengeHint", rules)}</Text>
      </View>

      <View style={styles.divider}>
        <View style={styles.line}>
          <DashedDivider thickness={2} />
        </View>
        <Text style={styles.or}>{tp("orDivider")}</Text>
        <View style={styles.line}>
          <DashedDivider thickness={2} />
        </View>
      </View>

      <View style={styles.block}>
        <Button
          variant="secondary"
          size="lg"
          fullWidth
          icon={
            <InfinityIcon size={16} color={buttonForeground("secondary")} />
          }
          onPress={() => router.push(practiceTrainingHref(slug, variant))}
          testID="start-training"
        >
          {tt("startButton")}
        </Button>
        <Text style={styles.hint}>{tp("modeTrainingHint")}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    gap: 20,
  },
  block: {
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.surface400,
    textAlign: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  line: {
    flex: 1,
  },
  or: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.surface400,
  },
});
