import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";

import { colors } from "../../lib/theme";

/** 表示を更新する間隔（0.1 秒刻みで出すため） */
const TICK_MS = 100;

/**
 * マウントからの経過ミリ秒。`running` が false になった時点で止まる
 * 経過時間
 *
 * 計測の起点はマウント。問題ごとに `key` を変えて付け直すことで、
 * 新しい問題で 0 から数え直す（状態のリセットを effect で書かない）。
 */
function useElapsedMs(running: boolean): number {
  const [startedAt] = useState(() => Date.now());
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    if (!running) return;
    const tick = () => setElapsedMs(Date.now() - startedAt);
    tick();
    const id = setInterval(tick, TICK_MS);
    return () => {
      clearInterval(id);
      // 止まった瞬間の値で固定する（次の tick を待たない）
      tick();
    };
  }, [running, startedAt]);

  return elapsedMs;
}

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
  const seconds = (useElapsedMs(running) / 1000).toFixed(1);
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
