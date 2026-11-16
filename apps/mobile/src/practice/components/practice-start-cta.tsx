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
import { InfinityIcon, PlayIcon } from "../../components/icons/icons";
import { colors } from "../../lib/theme";

/**
 * チャレンジ / トレーニングの開始導線
 *
 * 説明画面の下端に固定する帯（`Screen` の `footer`）の中身。本文をどこまで
 * スクロールしていても始められるよう、2 つのボタンを 1 行に並べる: 右にチャレンジ
 * （主。緑の塗り）、左にトレーニング（従。白地）。2 つは等幅で、主従は塗りだけで
 * 示す（幅に差を付けると、狭い方が文字に詰まって見える）。主操作を利き手の親指に
 * 近い右に置く。上の 1 行はチャレンジのルール（制限時間・ミス上限）。
 *
 * 却下: web の `PracticeStartCta` の形（本文の途中に、チャレンジ / 「または」の
 * 区切り線 / トレーニングを縦に並べ、それぞれの下に説明を添える）— 以前はこれを
 * 写していた。主操作が本文と一緒に流れて画面の外へ出るうえ、「または」の線は
 * web のフォームの形に見える。トレーニングの説明（時間無制限・1 問ごとに答え合わせ）
 * は帯に 2 行目を足すことになるので載せていない。
 */
export function PracticeStartCta({
  slug,
  variant,
  onStart,
}: {
  readonly slug: PracticeMenuSlug;
  readonly variant: string;
  /** チャレンジ・トレーニングのどちらかを押したとき（遷移の前に呼ぶ） */
  readonly onStart?: () => void;
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
      <Text style={styles.hint}>{labels.challengeHint}</Text>
      <View style={styles.buttons}>
        <Button
          variant="secondary"
          size="lg"
          style={styles.half}
          icon={
            <InfinityIcon size={16} color={buttonForeground("secondary")} />
          }
          onPress={() => {
            onStart?.();
            router.push(practiceTrainingHref(slug, variant));
          }}
          testID="start-training"
        >
          {labels.training}
        </Button>
        <Button
          size="lg"
          style={styles.half}
          icon={<PlayIcon size={16} color={buttonForeground("primary")} />}
          onPress={() => {
            onStart?.();
            router.push(practicePlayHref(slug, variant));
          }}
          testID="start-challenge"
        >
          {labels.challenge}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    gap: 8,
  },
  hint: {
    fontSize: 12,
    color: colors.surface500,
    textAlign: "center",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  // 2 つのボタンで行を等分する（文字の幅に依らない）
  half: {
    flex: 1,
    flexBasis: 0,
  },
});
