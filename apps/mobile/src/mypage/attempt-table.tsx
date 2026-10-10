import { StyleSheet, Text, View } from "react-native";
import type { ChallengeAttempt } from "@mahjong-scoring/features/my-record/types";
import { formatDate } from "@mahjong-scoring/features/my-record/stats";

import { DataTable, type DataTableColumn } from "../components/data-table";
import { colors } from "../lib/theme";

/** 「2026/10/05 23:51」が 14pt で 1 行に収まる幅 */
const DATE_COLUMN_WIDTH = 140;

/**
 * ミス数の文字色（web の `getMissColorClass`）
 *
 * 0 回は地の文字色、1 回は注意、2 回以上は危険。チャレンジはミス 3 回で
 * 終わるので、2 回は「あと 1 回」の警告に当たる。
 */
function missColor(incorrectAnswers: number): string {
  if (incorrectAnswers === 0) return colors.foreground;
  if (incorrectAnswers <= 1) return colors.warning;
  return colors.destructive;
}

/**
 * チャレンジの履歴の表（web の直近の履歴・全履歴の表）
 * チャレンジ履歴テーブル
 *
 * 日時（JST）・正解数・ミス数。`boardLabelOf` を渡すと種目の列を足す
 * （全履歴。土俵を混ぜて並べるため）。
 */
export function AttemptTable({
  attempts,
  headers,
  emptyMessage,
  boardLabelOf,
}: {
  readonly attempts: readonly ChallengeAttempt[];
  readonly headers: {
    readonly date: string;
    readonly menu?: string;
    readonly correctAnswers: string;
    readonly incorrectAnswers: string;
  };
  readonly emptyMessage: string;
  readonly boardLabelOf?: (attempt: ChallengeAttempt) => string;
}) {
  if (attempts.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }
  const columns: DataTableColumn[] = [
    // 種目の列があるときは日時を 1 行に収まる幅で固定し、残りを種目に回す
    boardLabelOf === undefined
      ? { label: headers.date, flex: 1.6 }
      : { label: headers.date, width: DATE_COLUMN_WIDTH },
    ...(boardLabelOf === undefined
      ? []
      : [{ label: headers.menu ?? "", flex: 1 }]),
    { label: headers.correctAnswers, align: "right", width: 56 },
    { label: headers.incorrectAnswers, align: "right", width: 56 },
  ];
  return (
    <DataTable
      density="dense"
      columns={columns}
      rows={attempts.map((attempt) => [
        <Text key="date" style={styles.cell}>
          {formatDate(attempt.createdAt)}
        </Text>,
        ...(boardLabelOf === undefined
          ? []
          : [
              <Text key="menu" style={styles.cell}>
                {boardLabelOf(attempt)}
              </Text>,
            ]),
        <Text key="score" style={[styles.cell, styles.number]}>
          {attempt.score}
        </Text>,
        <Text
          key="miss"
          style={[
            styles.cell,
            styles.number,
            { color: missColor(attempt.incorrectAnswers) },
          ]}
        >
          {attempt.incorrectAnswers}
        </Text>,
      ])}
    />
  );
}

const styles = StyleSheet.create({
  empty: {
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 15,
    color: colors.surface500,
  },
  cell: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  number: {
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
});
