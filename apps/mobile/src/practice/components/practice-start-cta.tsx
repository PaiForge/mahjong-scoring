import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { buildPracticeStartCtaLabels } from "@mahjong-scoring/features/practice/start-cta-labels";
import {
  practicePlayHref,
  practiceTrainingHref,
} from "@mahjong-scoring/features/routes";

import { Button, buttonForeground } from "../../components/button";
import { Divider } from "../../components/divider";
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
  const challenge = useTranslations("challenge");
  const practice = useTranslations("practice");
  const training = useTranslations("training");
  const labels = buildPracticeStartCtaLabels(
    { challenge, practice, training },
    practiceMenuBySlug(slug),
  );

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
          {labels.challenge}
        </Button>
        <Text style={styles.hint}>{labels.challengeHint}</Text>
      </View>

      <View style={styles.divider}>
        <View style={styles.line}>
          <Divider />
        </View>
        <Text style={styles.or}>{labels.orDivider}</Text>
        <View style={styles.line}>
          <Divider />
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
          {labels.training}
        </Button>
        <Text style={styles.hint}>{labels.trainingHint}</Text>
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
