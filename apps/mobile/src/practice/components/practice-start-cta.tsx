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
 * チャレンジ / トレーニングの開始導線
 *
 * 説明画面の下端に固定する帯（`Screen` の `footer`）の中身。本文をどこまで
 * スクロールしていても始められるよう、2 つのボタンを 1 行に並べる: 右にチャレンジ
 * （主。緑の塗り・幅を広く）、左にトレーニング（従。白地）。主操作を利き手の親指に
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
          style={styles.training}
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
          style={styles.challenge}
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

/**
 * 開始導線の 2 つのブロックを分ける「または」の区切り（web の `PracticeStartCtaDivider`）
 *
 * 試験の説明画面（本番 / 模試）が使う。練習の説明画面は下端の帯に並べるので使わない。
 */
export function StartCtaDivider({ label }: { readonly label: string }) {
  return (
    <View style={styles.divider}>
      <View style={styles.line}>
        <Divider />
      </View>
      <Text style={styles.or}>{label}</Text>
      <View style={styles.line}>
        <Divider />
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
  // 文字の幅で決まる（「トレーニング」が 1 行に収まる幅）。残りをチャレンジが取る
  training: {
    paddingHorizontal: 16,
  },
  challenge: {
    flex: 1,
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
