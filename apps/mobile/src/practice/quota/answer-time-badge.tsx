import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import { formatElapsedSeconds } from "@mahjong-scoring/features/session/timer-display";
import { useElapsedMs } from "@mahjong-scoring/features/session/use-elapsed-ms";

import { colors } from "../../lib/theme";

/**
 * 回答時間の表示（Pro の拡張機能。web の `AnswerTimeBadge`）
 * 回答時間バッジ
 *
 * 問題が出てから回答するまでの秒数を 0.1 秒刻みで出す（web と同じ）。問題ごとに
 * `key={questionSeq}` を付けて使い、マウントを起点に数える。保存はしない。
 */
export function AnswerTimeBadge({
  running,
}: {
  /** 計測中か。回答すると false にして値を止める */
  readonly running: boolean;
}) {
  const t = useTranslations("practiceQuota");
  const seconds = formatElapsedSeconds(useElapsedMs(running));
  return (
    <Text style={styles.text} testID="answer-time-badge">
      {t("answerTime", { seconds })}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    textAlign: "center",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    color: colors.surface500,
  },
});
